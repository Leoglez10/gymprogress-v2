
import { GoogleGenAI } from "@google/genai";
import { UserProfile } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTrainingSuggestions = async (acwrScore: number, profile: UserProfile): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Actúa como un entrenador personal de alto rendimiento.
    Mi puntuación ACWR (Acute:Chronic Workload Ratio) actual es ${acwrScore}.
    
    Datos del perfil:
    - Alias: ${profile.alias}
    - Objetivo: ${profile.goal}
    - Género: ${profile.gender}
    - Edad: ${profile.age}
    - Peso: ${profile.weight}kg
    - Altura: ${profile.height}cm
    
    Basado en este puntaje ACWR (donde 0.8-1.3 es óptimo, <0.8 es desentrenamiento y >1.5 es riesgo alto de lesión) y mi perfil, ¿qué ajustes específicos me sugerirías para mi entrenamiento esta semana? 
    Responde en español de forma motivadora, concisa y profesional (máximo 3-4 frases).
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
