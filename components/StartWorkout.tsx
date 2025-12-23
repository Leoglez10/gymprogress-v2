
import React, { useEffect, useState } from 'react';
import { CustomRoutine } from '../types';

interface StartWorkoutProps {
  onBack: () => void;
  onSessionStart: (routine: CustomRoutine) => void;
  onCreateCustom: (routineId?: string) => void;
  onStartFree: () => void;
}

const StartWorkout: React.FC<StartWorkoutProps> = ({ onBack, onSessionStart, onCreateCustom, onStartFree }) => {
  const [customRoutines, setCustomRoutines] = useState<CustomRoutine[]>([]);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('gymProgress_custom_routines') || '[]');
    setCustomRoutines(saved);
  }, []);

  const handleDeleteRoutine = (id: string) => {
    const updated = customRoutines.filter(r => r.id !== id);
    setCustomRoutines(updated);
    localStorage.setItem('gymProgress_custom_routines', JSON.stringify(updated));
    setRoutineToDelete(null);
  };

  return (
    <div className="min-h-full bg-background-light dark:bg-background-dark pb-40 animate-in fade-in duration-500">
      {/* Header ajustado */}
      <header className="flex items-center px-4 py-3 sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5 pt-[calc(max(1rem,env(safe-area-inset-top))+0.75rem)]">
        <button onClick={onBack} className="flex size-11 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-black tracking-tight flex-1 text-center pr-11">Entrenamiento</h2>
      </header>

      <div className="px-6 pt-8 pb-4">
        <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Elige tu modo</p>
        <h1 className="text-4xl font-black tracking-tighter leading-none">¿Qué quieres hacer?</h1>
      </div>

      <main className="px-4 space-y-4 pt-4">
        {/* MODO 1: SESIÓN LIBRE */}
        <section 
          onClick={onStartFree}
          className="group relative overflow-hidden bg-black rounded-[3rem] p-8 text-white shadow-2xl transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="absolute -right-10 -top-10 size-48 bg-primary/20 blur-3xl rounded-full"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-primary text-black text-[9px] font-black uppercase tracking-widest">Instantáneo</span>
              <h3 className="text-3xl font-black tracking-tighter">Sesión Libre</h3>
              <p className="text-slate-400 text-sm max-w-[200px] leading-tight font-medium">Empieza a registrar sin plan previo. Ideal para días creativos.</p>
            </div>
            <div className="size-20 rounded-[2rem] bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/40 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-5xl fill-1">timer</span>
            </div>
          </div>
        </section>

        {/* CREAR NUEVO - Ahora a ancho completo */}
        <button 
          onClick={() => onCreateCustom()}
          className="w-full flex items-center gap-6 bg-white dark:bg-surface-dark rounded-[2.5rem] p-6 border border-black/5 shadow-sm text-left active:scale-95 transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-2 -top-2 size-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
          <div className="size-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-500 flex items-center justify-center group-hover:-rotate-6 transition-transform shadow-inner shrink-0">
            <span className="material-symbols-outlined text-4xl fill-1">playlist_add</span>
          </div>
          <div className="flex-1">
            <h4 className="font-black text-xl leading-tight tracking-tight">Nueva Rutina</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-tight">Diseña tu plan a medida desde cero</p>
          </div>
          <span className="material-symbols-outlined text-slate-200 group-hover:text-primary transition-colors">chevron_right</span>
        </button>

        {/* LISTA DE MIS RUTINAS */}
        <section className="pt-6">
          <div className="flex items-center justify-between px-2 mb-4">
            <h2 className="text-xl font-black tracking-tight">Mis Rutinas Guardadas</h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">{customRoutines.length}</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {customRoutines.length > 0 ? (
              customRoutines.map((routine) => (
                <div 
                  key={routine.id}
                  onClick={() => onSessionStart(routine)}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-[2rem] border border-black/5 shadow-sm active:bg-slate-50 dark:active:bg-white/5 transition-all group cursor-pointer"
                >
                  <div className="size-14 rounded-2xl bg-slate-50 dark:bg-background-dark flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-primary group-hover:text-black transition-all duration-300">
                    <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">fitness_center</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base leading-tight truncate text-slate-900 dark:text-white">{routine.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-primary-text uppercase tracking-wide bg-primary/10 px-2 py-0.5 rounded-md">
                        {routine.exercises.length} Ejercicios
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onCreateCustom(routine.id); }}
                      aria-label="Editar rutina"
                      className="size-10 flex items-center justify-center rounded-full text-slate-300 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <span className="material-symbols-outlined text-[22px]">edit</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRoutineToDelete(routine.id); }}
                      aria-label="Eliminar rutina"
                      className="size-10 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <span className="material-symbols-outlined text-[22px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                 <span className="material-symbols-outlined text-6xl">folder_off</span>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em]">Crea tu primer plan</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modal de Confirmación */}
      {routineToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white dark:bg-surface-dark rounded-[3rem] p-8 shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95">
            <div className="size-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <div>
              <h3 className="text-xl font-black mb-1">¿Borrar rutina?</h3>
              <p className="text-xs text-slate-400 font-medium">Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <button onClick={() => handleDeleteRoutine(routineToDelete)} className="w-full py-4 rounded-full bg-red-500 text-white font-black text-sm active:scale-95 transition-all">ELIMINAR</button>
              <button onClick={() => setRoutineToDelete(null)} className="w-full py-4 rounded-full bg-slate-100 dark:bg-background-dark text-slate-400 font-black text-sm active:scale-95 transition-all">CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartWorkout;
