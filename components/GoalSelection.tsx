
import React, { useState } from 'react';

interface GoalSelectionProps {
  onSelect: (goal: 'Strength' | 'Hypertrophy' | 'WeightLoss') => void;
}

interface GoalInfo {
  title: string;
  desc: string;
  icon: string;
  tags: string[];
}

const GOAL_DETAILS: Record<string, GoalInfo> = {
  Strength: {
    title: "Fuerza Máxima",
    desc: "Enfoque en mover el máximo peso posible. Ideal para Powerlifting y ganar densidad ósea.",
    icon: "fitness_center",
    tags: ["1-5 Reps", "Descansos largos", "Cargas >85%"]
  },
  Hypertrophy: {
    title: "Hipertrofia",
    desc: "Enfoque en el crecimiento muscular estético a través de un mayor volumen de trabajo.",
    icon: "body_system",
    tags: ["8-12 Reps", "Descansos 60-90s", "Fallo muscular"]
  },
  WeightLoss: {
    title: "Quema de Grasa",
    desc: "Mantener masa muscular mientras se prioriza el gasto calórico y la densidad del entrenamiento.",
    icon: "local_fire_department",
    tags: ["12-15 Reps", "Descansos cortos", "Alta densidad"]
  }
};

const GoalSelection: React.FC<GoalSelectionProps> = ({ onSelect }) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark p-6 animate-in fade-in duration-500 relative">
      {/* Botón Maestro de Ayuda - Estilo Premium */}
      <div className="absolute top-12 right-6 z-30">
        <button 
          onClick={() => setShowGuide(true)}
          className="size-14 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-2xl flex items-center justify-center active:scale-90 transition-all border border-white/10"
          aria-label="Ayuda"
        >
          <span className="material-symbols-outlined font-black text-2xl">help</span>
        </button>
      </div>

      <div className="pt-12 pb-10 pr-16">
        <p className="text-[10px] font-black uppercase text-primary-text/40 dark:text-white/40 tracking-[0.3em] mb-2">Comienza aquí</p>
        <h1 className="text-4xl font-black leading-[1.05] tracking-tighter">¿Cuál es tu meta principal?</h1>
        <p className="text-slate-500 mt-3 font-medium">Personalizaremos tu experiencia según tu elección.</p>
      </div>

      <div className="flex-1 flex flex-col gap-5">
        <GoalCard 
          title="Fuerza Máxima" 
          description="Cargas pesadas y potencia pura." 
          icon="fitness_center"
          onClick={() => onSelect('Strength')}
        />
        <GoalCard 
          title="Hipertrofia" 
          description="Maximizar el crecimiento muscular." 
          icon="body_system"
          onClick={() => onSelect('Hypertrophy')}
        />
        <GoalCard 
          title="Quema de Grasa" 
          description="Optimizar el gasto calórico." 
          icon="local_fire_department"
          onClick={() => onSelect('WeightLoss')}
        />
      </div>

      <div className="py-8 px-2 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="text-[11px] font-bold uppercase tracking-widest">
            Puedes cambiar tu objetivo después en tu perfil
          </p>
        </div>
      </div>

      {/* Guía Comparativa Unificada - Pantalla Completa */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-end animate-in fade-in duration-300 p-4 pb-0">
          <div onClick={() => setShowGuide(false)} className="absolute inset-0"></div>
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] p-8 pb-16 shadow-2xl animate-in slide-in-from-bottom duration-500 relative flex flex-col max-h-[92vh]">
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8 opacity-40"></div>
            
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-3xl font-black tracking-tighter">Guía de Entrenamiento</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Diferencias clave</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="size-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 active:scale-90">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pr-2">
              {Object.entries(GOAL_DETAILS).map(([key, info]) => (
                <div key={key} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-black shrink-0 shadow-lg shadow-primary/20">
                      <span className="material-symbols-outlined font-black text-2xl">{info.icon}</span>
                    </div>
                    <h4 className="text-xl font-black tracking-tight">{info.title}</h4>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {info.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {info.tags.map(tag => (
                      <span key={tag} className="px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowGuide(false)}
              className="w-full py-6 mt-10 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-base active:scale-95 transition-all uppercase tracking-widest shadow-2xl"
            >
              ENTENDIDO, VOLVER
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const GoalCard: React.FC<{ title: string; description: string; icon: string; onClick: () => void }> = ({ title, description, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full p-7 rounded-[3rem] bg-white dark:bg-surface-dark border border-black/5 flex items-center gap-6 text-left active:scale-[0.97] transition-all hover:border-primary/50 shadow-sm group relative overflow-hidden"
  >
    <div className="size-20 rounded-[1.8rem] bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20 shrink-0 group-hover:scale-105 transition-transform duration-500">
      <span className="material-symbols-outlined text-4xl font-black">{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-black text-2xl tracking-tighter leading-none mb-2">{title}</h3>
      <p className="text-xs text-slate-400 font-medium leading-tight">{description}</p>
    </div>
    <div className="size-10 flex items-center justify-center text-slate-200 group-hover:text-primary transition-colors">
      <span className="material-symbols-outlined text-3xl">chevron_right</span>
    </div>
  </button>
);

export default GoalSelection;
