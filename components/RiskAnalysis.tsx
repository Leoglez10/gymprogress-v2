
import React, { useState, useEffect, useMemo } from 'react';
import { getTrainingSuggestions } from '../services/geminiService';
import { UserProfile, WellnessEntry } from '../types';

interface RiskAnalysisProps {
  onBack: () => void;
  userProfile: UserProfile;
}

const INFO_TEXTS = {
  acwr: {
    title: "¿Qué es el ACWR?",
    body: "Es la relación entre tu carga de trabajo de los últimos 7 días (Aguda) y los últimos 28 días (Crónica). Mantener este ratio entre 0.8 y 1.3 es el 'Punto Dulce' para progresar minimizando el riesgo de lesión. Valores por encima de 1.5 indican un riesgo muy elevado."
  },
  readyScore: {
    title: "¿Cómo se calcula?",
    body: "Tu Ready Score evalúa tu estado sistémico hoy. Combina la calidad del sueño, tus niveles de energía percibida, el estrés acumulado y las agujetas de sesiones previas para determinar cuánto puedes exigirle a tu cuerpo en la sesión de hoy."
  }
};

const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ onBack, userProfile }) => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeHelp, setActiveHelp] = useState<keyof typeof INFO_TEXTS | null>(null);
  const [wellness, setWellness] = useState<WellnessEntry>({
    date: new Date().toDateString(),
    sleep: 2,
    energy: 2,
    stress: 2,
    soreness: 1
  });

  useEffect(() => {
    const savedHistory = localStorage.getItem('gymProgress_workout_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedWellness = localStorage.getItem('gymProgress_daily_wellness');
    if (savedWellness) {
      const parsed = JSON.parse(savedWellness);
      if (parsed.date === new Date().toDateString()) {
        setWellness(parsed);
      }
    }
  }, []);

  const workloadStats = useMemo(() => {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const acuteDays = 7;
    const chronicDays = 28;
    const acuteLimit = new Date(now.getTime() - acuteDays * oneDayMs);
    const chronicLimit = new Date(now.getTime() - chronicDays * oneDayMs);

    let acuteVolume = 0;
    let chronicVolume = 0;

    history.forEach(session => {
      const sessionDate = new Date(session.date);
      const vol = Number(session.volume) || 0;
      if (sessionDate >= acuteLimit) acuteVolume += vol;
      if (sessionDate >= chronicLimit) chronicVolume += vol;
    });

    const dailyAcuteAverage = acuteVolume / acuteDays;
    const dailyChronicAverage = chronicVolume / chronicDays;
    const acwr = dailyChronicAverage > 0 
      ? parseFloat((dailyAcuteAverage / dailyChronicAverage).toFixed(2)) 
      : 0;

    return { acwr, acuteVolume, chronicVolume };
  }, [history]);

  const saveWellness = (newWellness: WellnessEntry) => {
    setWellness(newWellness);
    localStorage.setItem('gymProgress_daily_wellness', JSON.stringify(newWellness));
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const result = await getTrainingSuggestions(workloadStats.acwr, userProfile, wellness);
      setSuggestion(result);
    } catch (error) {
      setSuggestion("No pude conectar con el Coach. Mantén la intensidad moderada hoy.");
    }
    setLoading(false);
  };

  const readinessScore = useMemo(() => {
    const s = (wellness.sleep / 3) * 35;
    const e = (wellness.energy / 3) * 35;
    const st = ((4 - wellness.stress) / 3) * 15; 
    const so = ((4 - wellness.soreness) / 3) * 15;
    return Math.round(s + e + st + so);
  }, [wellness]);

  const statusInfo = useMemo(() => {
    const val = workloadStats.acwr;
    if (val === 0) return { label: 'Sin Datos', color: 'text-slate-400', bg: 'bg-slate-500/10', desc: 'Entrena unos días para ver tu riesgo.' };
    if (val > 1.5) return { label: 'Peligro', color: 'text-rose-500', bg: 'bg-rose-500/10', desc: 'Carga excesiva. El riesgo de lesión es muy alto hoy.' };
    if (val > 1.3) return { label: 'Sobrecarga', color: 'text-amber-500', bg: 'bg-amber-500/10', desc: 'Estás al límite. Considera una sesión ligera de técnica.' };
    if (val < 0.8) return { label: 'Infraentreno', color: 'text-sky-400', bg: 'bg-sky-400/10', desc: 'Tu cuerpo ha recuperado demasiado. ¡Hora de apretar!' };
    return { label: 'Óptimo', color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Estás en el "Sweet Spot". Máximo rendimiento garantizado.' };
  }, [workloadStats.acwr]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-40 animate-in fade-in duration-500">
      <header className="flex items-center justify-between p-6 sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-b border-black/5 dark:border-white/5 pt-[calc(max(1rem,env(safe-area-inset-top))+0.75rem)]">
        <button onClick={onBack} className="flex size-11 items-center justify-center rounded-2xl bg-white dark:bg-white/5 text-slate-500 active:scale-90 transition-all border border-black/5">
          <span className="material-symbols-outlined text-2xl font-black">arrow_back</span>
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black tracking-tighter leading-none">Mi Salud</h2>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.25em] mt-1">Análisis Biométrico</p>
        </div>
        <div className="size-11"></div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-10 overflow-y-auto no-scrollbar">
        
        {/* PANEL DE CONTROL ACWR */}
        <section className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-8 shadow-xl border border-black/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 flex gap-2">
             <button 
                onClick={() => setActiveHelp('acwr')}
                className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-all border border-primary/20"
             >
                <span className="material-symbols-outlined text-xl font-black">help</span>
             </button>
             <div className="size-16 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-3xl font-black group-hover:rotate-12 transition-transform">monitoring</span>
             </div>
          </div>

          <div className="mb-8">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Carga de Trabajo (ACWR)</p>
            <div className="flex items-baseline gap-2">
               <h1 className="text-6xl font-black tracking-tighter tabular-nums leading-none">
                 {workloadStats.acwr || '0.0'}
               </h1>
               <span className={`text-sm font-black uppercase tracking-widest ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-white/5 rounded-full mb-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-sky-400 via-emerald-500 to-rose-500 opacity-20"></div>
             <div 
                className={`absolute top-0 h-full transition-all duration-1000 ease-out rounded-full shadow-lg ${statusInfo.color.replace('text', 'bg')}`} 
                style={{ width: `${Math.min(100, (workloadStats.acwr / 2) * 100)}%` }}
             ></div>
             <div className="absolute left-[40%] right-[65%] h-full border-x-2 border-emerald-500/30 bg-emerald-500/10"></div>
          </div>

          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic pr-12">
            "{statusInfo.desc}"
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-black/5 dark:border-white/5 pt-8">
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Carga Aguda (7d)</span>
                <span className="text-xl font-black tabular-nums">{workloadStats.acuteVolume.toLocaleString()} <span className="text-[10px] opacity-40">kg</span></span>
             </div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Carga Crónica (28d)</span>
                <span className="text-xl font-black tabular-nums">{workloadStats.chronicVolume.toLocaleString()} <span className="text-[10px] opacity-40">kg</span></span>
             </div>
          </div>
        </section>

        {/* READY SCORE INTERACTIVO */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-3">
             <div className="flex flex-col relative">
               <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black tracking-tighter">Ready Score</h3>
                <button 
                  onClick={() => setActiveHelp('readyScore')}
                  className="size-6 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-400 flex items-center justify-center active:scale-75 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px] font-black">help</span>
                </button>
               </div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado Sistémico</p>
             </div>
             <div className="relative size-20 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                   <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-white/5" />
                   <circle 
                      cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                      strokeDasharray="283" 
                      strokeDashoffset={283 - (283 * readinessScore) / 100}
                      strokeLinecap="round"
                      className={`transition-all duration-1000 ${readinessScore > 70 ? 'text-primary' : readinessScore > 40 ? 'text-amber-400' : 'text-rose-500'}`}
                   />
                </svg>
                <span className="absolute font-black text-xl tabular-nums">{readinessScore}%</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <WellnessCard 
               label="Sueño" 
               icon="bedtime" 
               value={wellness.sleep} 
               options={['Pobre', 'OK', 'Élite']}
               colors={['text-rose-400', 'text-amber-400', 'text-emerald-400']}
               onChange={(v) => saveWellness({...wellness, sleep: v})}
            />
            <WellnessCard 
               label="Energía" 
               icon="bolt" 
               value={wellness.energy} 
               options={['Baja', 'Zen', 'Fuego']}
               colors={['text-rose-400', 'text-sky-400', 'text-primary']}
               onChange={(v) => saveWellness({...wellness, energy: v})}
            />
            <WellnessCard 
               label="Estrés" 
               icon="psychology" 
               value={wellness.stress} 
               options={['Relax', 'Normal', 'Caos']}
               colors={['text-emerald-400', 'text-slate-400', 'text-rose-400']}
               onChange={(v) => saveWellness({...wellness, stress: v})}
            />
            <WellnessCard 
               label="Agujetas" 
               icon="personal_injury" 
               value={wellness.soreness} 
               options={['Cero', 'Light', 'Duras']}
               colors={['text-emerald-400', 'text-amber-400', 'text-rose-400']}
               onChange={(v) => saveWellness({...wellness, soreness: v})}
            />
          </div>
        </section>

        {/* IA COACH INSIGHTS REDISEÑADO */}
        <section className="bg-black dark:bg-zinc-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
          <div className="absolute -right-16 -top-16 size-48 bg-primary/10 blur-[80px] rounded-full"></div>
          
          <div className="flex items-center gap-6 mb-10 relative z-10">
            <div className="size-16 rounded-[2rem] bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/20 shrink-0">
              <span className="material-symbols-outlined text-4xl font-black">neurology</span>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight leading-none">Veredicto IA</h3>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mt-2">Coach de Alto Rendimiento</p>
            </div>
          </div>

          <div className="relative z-10 min-h-[140px] flex flex-col justify-center">
            {suggestion ? (
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 mb-8 animate-in zoom-in-95 duration-500">
                <p className="text-lg font-bold leading-relaxed text-slate-200 italic">
                  "{suggestion}"
                </p>
              </div>
            ) : (
              <div className="text-center py-6 mb-6">
                 <span className="material-symbols-outlined text-5xl text-white/10 mb-4 block">analytics</span>
                 <p className="text-slate-500 text-sm font-medium leading-relaxed">Analizaré tu ACWR real ({workloadStats.acwr}) para optimizar tu sesión de hoy.</p>
              </div>
            )}

            <button 
              onClick={fetchSuggestions}
              disabled={loading}
              className="w-full h-20 bg-primary text-black rounded-full font-black text-lg uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,239,10,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded-full border-[3px] border-black border-t-transparent animate-spin"></div>
                  <span className="text-sm">CALCULANDO...</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined font-black text-2xl">offline_bolt</span>
                  {suggestion ? 'REAJUSTAR PLAN' : 'OBTENER ESTRATEGIA'}
                </>
              )}
            </button>
          </div>
        </section>

      </main>

      {/* MODAL DE AYUDA UNIFICADO */}
      {activeHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div onClick={() => setActiveHelp(null)} className="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
          <div className="relative w-full max-w-xs bg-white dark:bg-surface-dark rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl font-black">info</span>
            </div>
            <h3 className="text-xl font-black tracking-tight mb-4">{INFO_TEXTS[activeHelp].title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
              {INFO_TEXTS[activeHelp].body}
            </p>
            <button 
              onClick={() => setActiveHelp(null)}
              className="w-full py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const WellnessCard: React.FC<{ 
  label: string; 
  icon: string; 
  value: number; 
  options: string[]; 
  colors: string[];
  onChange: (v: number) => void;
}> = ({ label, icon, value, options, colors, onChange }) => (
  <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-6 shadow-md border border-black/5 flex flex-col items-center">
    <div className="flex items-center gap-2 mb-5">
       <span className="material-symbols-outlined text-slate-300 text-xl">{icon}</span>
       <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
    </div>
    
    <div className="flex flex-col w-full gap-2">
      {[1, 2, 3].map((num, i) => (
        <button
          key={num}
          onClick={() => onChange(num)}
          className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
            value === num 
              ? `bg-black dark:bg-white ${colors[i]} border-transparent shadow-lg scale-105` 
              : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-300'
          }`}
        >
          {options[i]}
        </button>
      ))}
    </div>
  </div>
);

export default RiskAnalysis;
