
import React, { useState } from 'react';
import { getTrainingSuggestions } from '../services/geminiService';
import { UserProfile } from '../types';

interface RiskAnalysisProps {
  onBack: () => void;
  userProfile: UserProfile;
}

const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ onBack, userProfile }) => {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const acwrValue = 1.15; // Valor simulado para el ejemplo

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const result = await getTrainingSuggestions(acwrValue, userProfile);
      setSuggestion(result);
    } catch (error) {
      setSuggestion("Hubo un error al obtener las sugerencias. Por favor, intenta de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32">
      <header className="flex items-center justify-between p-4 sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold">Análisis de Riesgo</h2>
        <button className="flex size-10 items-center justify-center rounded-full">
          <span className="material-symbols-outlined">help</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col px-4 gap-6 pt-6 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center justify-center pt-2 pb-4">
          <div className="relative flex items-center justify-center size-64 scale-110">
            <div className="absolute inset-0 rounded-full border-[24px] border-slate-100 dark:border-slate-800"></div>
            <div 
              className="absolute inset-0 rounded-full border-[24px] border-transparent transition-all duration-1000" 
              style={{ 
                background: 'conic-gradient(from 180deg, #34c759 0deg, #34c759 210deg, transparent 210deg)', 
                WebkitMask: 'radial-gradient(transparent 61%, black 62%)', 
                mask: 'radial-gradient(transparent 61%, black 62%)' 
              }}
            ></div>
            <div className="z-10 flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Score ACWR</span>
              <h1 className="text-6xl font-bold tracking-tighter tabular-nums">{acwrValue}</h1>
              <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 shadow-sm">
                <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Zona Óptima</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 max-w-[280px] mt-8 leading-relaxed">
            Tu ratio <span className="text-slate-900 dark:text-white font-bold">Carga Aguda/Crónica</span> indica que estás en el punto ideal para ganar fuerza sin sobreentrenar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <LoadCard 
            title="Carga Aguda" 
            subtitle="Últimos 7 días"
            value="4,200 kg" 
            trend="+5% vs prev" 
            positive 
          />
          <LoadCard 
            title="Carga Crónica" 
            subtitle="Últimos 28 días"
            value="3,500 kg" 
            trend="Base sólida" 
          />
        </div>

        {/* Sección Sugerencias Inteligentes */}
        <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-6 shadow-xl border border-black/5 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-6xl">insights</span>
          </div>
          
          <div className="flex items-center gap-4 mb-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-[#181811] shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl fill-1">bolt</span>
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">Sugerencias del Entrenamiento</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recomendaciones personalizadas</p>
            </div>
          </div>

          <div className="space-y-4">
            {!suggestion ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">
                Presiona el botón de abajo para analizar tu tendencia actual y recibir consejos basados en tu objetivo de <span className="font-bold text-primary-text">{userProfile.goal === 'Strength' ? 'Fuerza' : userProfile.goal === 'Hypertrophy' ? 'Hipertrofia' : 'Pérdida de peso'}</span>.
              </p>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-background-dark/50 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {suggestion}
                </p>
              </div>
            )}

            <button 
              onClick={fetchSuggestions}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 h-14 rounded-full bg-primary text-[#181811] text-sm font-bold tracking-wide transition-all active:scale-[0.97] shadow-lg shadow-primary/10 disabled:opacity-50 overflow-hidden relative"
            >
              {loading && (
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              )}
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
                  <span>Analizando historial...</span>
                </div>
              ) : (
                <>
                  <span>{suggestion ? 'Recalcular Sugerencia' : 'Ver Recomendación'}</span>
                  <span className="material-symbols-outlined text-[20px]">trending_up</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

const LoadCard: React.FC<{ title: string; subtitle: string; value: string; trend: string; positive?: boolean }> = ({ title, subtitle, value, trend, positive }) => (
  <div className="flex flex-col gap-3 rounded-3xl p-5 bg-white dark:bg-surface-dark shadow-sm border border-black/5 dark:border-white/5">
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</p>
      <p className="text-[9px] font-medium text-slate-300 dark:text-slate-500">{subtitle}</p>
    </div>
    <div>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${positive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
        {positive && <span className="material-symbols-outlined text-[10px] font-bold">trending_up</span>}
        {trend}
      </div>
    </div>
  </div>
);

export default RiskAnalysis;
