
import { GoogleGenAI } from "@google/genai";
import { UserProfile, WellnessEntry } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTrainingSuggestions = async (
  acwrScore: number, 
  profile: UserProfile, 
  wellness?: WellnessEntry
): Promise<string> => {
  const ai = getAI();
  
  const wellnessContext = wellness 
    ? `- Bienestar: Sueño(${wellness.sleep}/3), Energía(${wellness.energy}/3), Estrés(${wellness.stress}/3), Agujetas(${wellness.soreness}/3)`
    : "- Bienestar: No registrado hoy.";

  const prompt = `
    Actúa como un entrenador personal y fisioterapeuta de alto rendimiento.
    Mi puntuación ACWR (Acute:Chronic Workload Ratio) actual es ${acwrScore}.
    
    Contexto de Salud hoy:
    ${wellnessContext}

    Datos del perfil:
    - Alias: ${profile.alias}
    - Objetivo: ${profile.goal}
    - Edad: ${profile.age} años
    
    Basado en el ACWR (0.8-1.3 óptimo, >1.5 riesgo alto) y mi estado de bienestar, ¿qué ajustes específicos me sugerirías para mi entrenamiento HOY? 
    Responde en español de forma motivadora, concisa y técnica. Máximo 3 frases.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  
  return response.text || "Consulta a un profesional para sugerencias detalladas.";
};

export const getVolumeInsight = async (currentVolume: number, prevVolume: number, profile: UserProfile): Promise<string> => {
  const ai = getAI();
  const ratioToBodyweight = (currentVolume / profile.weight).toFixed(1);
  const trend = currentVolume > prevVolume ? "en aumento" : "en descenso o estable";
  
  const prompt = `
    Analiza la calidad de mi volumen de entrenamiento semanal.
    - Mi volumen actual: ${currentVolume} kg.
    - Mi peso corporal: ${profile.weight} kg. (Ratio de carga semanal: ${ratioToBodyweight}x mi peso).
    - Mi volumen anterior: ${prevVolume} kg. Mi tendencia es ${trend}.
    - Mi objetivo: ${profile.goal}.
    
    ¿Este volumen es bueno o malo para mí? Explica qué indica este número sobre mi nivel actual (novato, intermedio o avanzado) y si es coherente con mi meta de ${profile.goal}. 
    Sé muy específico, profesional y directo. Máximo 3 frases. Usa un tono de experto en fisiología del ejercicio.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  
  return response.text || "Tu volumen indica un trabajo constante. Sigue así para ver resultados.";
};

/**
 * Calcula volumen ideal desde cero basado en biometría con máxima precisión
 */
export const getTargetVolumeRecommendation = async (profile: UserProfile): Promise<string> => {
  const ai = getAI();
  
  const prompt = `
    Actúa como un PhD en Ciencias del Deporte experto en hipertrofia y fuerza. 
    Tu misión es dar una recomendación MATEMÁTICA EXACTA de volumen semanal.
    
    PERFIL DEL ATLETA:
    - Peso: ${profile.weight} ${profile.weightUnit}
    - Objetivo: ${profile.goal} (Strength=Fuerza, Hypertrophy=Hipertrofia, WeightLoss=Quema grasa)
    - Edad: ${profile.age} años
    - Género: ${profile.gender}

    INSTRUCCIONES DE CÁLCULO:
    1. Si es Hipertrofia: Recomienda un volumen de 150x a 250x su peso corporal en KG totales semanales.
    2. Si es Fuerza: Recomienda 100x a 150x su peso, pero con intensidades muy altas.
    3. Si es Quema de Grasa: Recomienda un volumen moderado-alto (180x peso) para preservar músculo.

    FORMATO DE RESPUESTA OBLIGATORIO (en español):
    - Comienza SIEMPRE con: "Viendo tus datos de ${profile.weight}kg y tu meta de ${profile.goal}, te recomiendo configurar tu meta en [CIFRA EXACTA] ${profile.weightUnit}."
    - Luego da una breve explicación técnica (máximo 2 frases) sobre el volumen de mantenimiento (MV) y el volumen máximo recuperable (MRV) para su caso.
    - Sé directo y ultra-profesional.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt
  });

  return response.text || `Basado en tu peso de ${profile.weight}${profile.weightUnit}, un punto de partida óptimo son ${(profile.weight * 200).toLocaleString()} ${profile.weightUnit} semanales.`;
};

export const getWeeklyVolumeSummary = async (totalVolume: number, muscleDist: any[]): Promise<string> => {
  const ai = getAI();
  const topMuscles = muscleDist.slice(0, 2).map(m => m.name).join(' y ');
  const prompt = `
    Analiza mi volumen de entrenamiento de esta semana:
    - Volumen total movido: ${totalVolume} kg.
    - Grupos más trabajados: ${topMuscles}.
    
    Dame un resumen muy breve (2 frases máximo) en español sobre qué tipo de trabajo predominó esta semana (fuerza, volumen general o enfoque específico) y qué impacto positivo tiene en mi progreso. Sé motivador y profesional.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });
  
  return response.text || "Has mantenido un volumen sólido esta semana. El enfoque en " + topMuscles + " ayudará a tu progresión.";
};
