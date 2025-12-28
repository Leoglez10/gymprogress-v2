
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Exercise, CustomExerciseEntry, UserProfile, Set } from '../types';
import { getMuscleDefaultImage } from './ExerciseLibrary';

interface ManualLogProps {
  onBack: () => void;
  onSave: () => void;
  initialDate?: Date;
  userProfile: UserProfile;
}

interface UIExerciseEntry extends CustomExerciseEntry {
  uiId: string;
}

const CATEGORY_MUSCLE_MAP: Record<string, string[]> = {
  'Push': ['Pecho', 'Hombros', 'Brazos'],
  'Pull': ['Espalda', 'Brazos'],
  'Legs': ['Piernas'],
  'Core': ['Core']
};

const ManualLog: React.FC<ManualLogProps> = ({ onBack, onSave, initialDate, userProfile }) => {
  // Función para obtener YYYY-MM-DD local
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());
  
  const [logDate, setLogDate] = useState<string>(
    initialDate ? getLocalDateString(initialDate) : todayStr
  );
  const [selectedExercises, setSelectedExercises] = useState<UIExerciseEntry[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newExerciseCategory, setNewExerciseCategory] = useState<any>('Push');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('Pecho');

  useEffect(() => {
    const savedLibrary = localStorage.getItem('gymProgress_exercises');
    if (savedLibrary) setLibrary(JSON.parse(savedLibrary));
  }, []);

  const filteredLibrary = useMemo(() => {
    return library.filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [library, searchTerm]);

  const handleAddFromLibrary = (exercise: Exercise) => {
    const newEntry: UIExerciseEntry = { 
      exerciseId: exercise.id, 
      name: exercise.name, 
      sets: [{ reps: 10, weight: 0, completed: true }], 
      uiId: `ui-${exercise.id}-${Date.now()}` 
    };
    setSelectedExercises(prev => [...prev, newEntry]);
    setShowSelector(false);
    setSearchTerm('');
  };

  const createAndAddExercise = () => {
    if (!searchTerm.trim()) return;
    const newEx: Exercise = {
      id: `custom_${Date.now()}`,
      name: searchTerm,
      muscleGroup: newExerciseMuscle,
      category: newExerciseCategory,
      difficulty: 'Principiante',
      equipment: 'Peso Corporal',
      type: 'Personalizado',
      thumbnail: getMuscleDefaultImage(newExerciseMuscle)
    };
    const updatedLibrary = [newEx, ...library];
    setLibrary(updatedLibrary);
    localStorage.setItem('gymProgress_exercises', JSON.stringify(updatedLibrary));
    handleAddFromLibrary(newEx);
    setIsCreatingNew(false);
  };

  const updateSet = (exerciseIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) => {
    const updated = [...selectedExercises];
    let cleanValue = isNaN(value) ? 0 : Math.max(0, value);
    if (field === 'weight') cleanValue = Math.min(1000, cleanValue);
    if (field === 'reps') cleanValue = Math.min(999, Math.round(cleanValue));
    
    updated[exerciseIdx].sets[setIdx] = { 
      ...updated[exerciseIdx].sets[setIdx], 
      [field]: cleanValue
    };
    setSelectedExercises(updated);
  };

  const handleSave = () => {
    if (selectedExercises.length === 0) return;
    if (logDate > todayStr) {
      alert("No puedes registrar sesiones en el futuro.");
      return;
    }
    
    const totalVolume = selectedExercises.reduce((acc, ex) => 
      acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0
    );

    // Usamos T12:00:00 para forzar que el registro caiga en el día correcto sin importar el desfase UTC
    const sessionTimestamp = new Date(logDate + 'T12:00:00').toISOString();

    const newRecord = {
      id: String(Date.now()),
      date: sessionTimestamp,
      volume: totalVolume,
      duration: "30m",
      unit: userProfile.weightUnit,
      name: "Registro Manual",
      exercises: selectedExercises.map(({ uiId, ...rest }) => ({
        ...rest,
        sets: rest.sets.map(s => ({ ...s, completed: true }))
      }))
    };

    const saved = localStorage.getItem('gymProgress_workout_history');
    const history = saved ? JSON.parse(saved) : [];
    localStorage.setItem('gymProgress_workout_history', JSON.stringify([...history, newRecord]));
    
    onSave();
  };

  const isFutureDate = logDate > todayStr;

  return (
    <div className="flex flex-col min-h-full bg-background-light dark:bg-background-dark pb-48 animate-in fade-in duration-500">
      <header className="flex items-center px-4 py-3 sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5 pt-[calc(max(1rem,env(safe-area-inset-top))+0.75rem)]">
        <button onClick={onBack} className="flex size-11 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-black tracking-tight flex-1 text-center pr-11">Registro Manual</h2>
      </header>

      <main className="px-6 space-y-10 pt-8">
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Fecha del Entrenamiento</label>
            {isFutureDate && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Inválida</span>}
          </div>
          <div className={`relative w-full h-[72px] bg-white dark:bg-surface-dark border-2 rounded-[2.5rem] flex items-center shadow-sm transition-all overflow-hidden ${isFutureDate ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-black/5'}`}>
            <div className="absolute left-6 pointer-events-none z-10 flex items-center">
              <span className={`material-symbols-outlined text-2xl font-black ${isFutureDate ? 'text-rose-500' : 'text-primary'}`}>calendar_today</span>
            </div>
            
            <span className="pl-16 font-black text-xl truncate pr-12">
               {new Date(logDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>

            <input 
              type="date" 
              value={logDate} 
              max={todayStr}
              onChange={(e) => setLogDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full h-full"
              style={{ colorScheme: 'dark' }}
            />
            
            <div className="absolute right-6 pointer-events-none z-10">
              <span className="material-symbols-outlined text-slate-300">expand_more</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-2xl tracking-tighter leading-none">Ejercicios</h3>
            <button 
              onClick={() => setShowSelector(true)}
              className="h-12 px-6 rounded-2xl bg-primary text-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined font-black">add_circle</span>
              <span className="text-[10px] font-black uppercase tracking-widest">Añadir</span>
            </button>
          </div>

          <div className="space-y-8">
            {selectedExercises.length > 0 ? (
              selectedExercises.map((ex, exIdx) => (
                <div key={ex.uiId} className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-6 shadow-xl border border-black/5 space-y-8 animate-in slide-in-from-right-4">
                  <div className="flex justify-between items-center px-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="size-12 rounded-2xl bg-slate-50 dark:bg-background-dark flex items-center justify-center shrink-0 shadow-inner">
                         <span className="material-symbols-outlined text-primary font-black">fitness_center</span>
                      </div>
                      <h4 className="font-black text-xl tracking-tight truncate text-slate-900 dark:text-white">{ex.name}</h4>
                    </div>
                    <button 
                      onClick={() => setSelectedExercises(prev => prev.filter((_, i) => i !== exIdx))}
                      className="size-10 rounded-full flex items-center justify-center text-slate-200 hover:text-red-500 transition-all active:scale-75"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                  
                  <div className="space-y-10">
                    {ex.sets.map((set, setIdx) => (
                      <div key={setIdx} className="p-8 bg-slate-50 dark:bg-background-dark/50 rounded-[3rem] border border-black/5 relative group">
                        <div className="flex items-center justify-between mb-8 px-2">
                           <div className="flex items-center gap-4">
                              <div className="size-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-black shrink-0 shadow-lg">{setIdx + 1}</div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuración de Serie</span>
                           </div>
                           <button 
                            onClick={() => {
                              if (ex.sets.length <= 1) return;
                              const updated = [...selectedExercises];
                              updated[exIdx].sets = updated[exIdx].sets.filter((_, i) => i !== setIdx);
                              setSelectedExercises(updated);
                            }}
                            className="text-slate-300 active:text-red-500 transition-colors"
                           >
                            <span className="material-symbols-outlined text-2xl">close</span>
                           </button>
                        </div>

                        <div className="space-y-8">
                           <div className="space-y-3">
                              <div className="flex justify-between items-center px-4">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Peso ({userProfile.weightUnit})</span>
                                <span className="text-[9px] font-black text-primary uppercase bg-black dark:bg-white/10 px-2 py-0.5 rounded-md">Carga</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 bg-white dark:bg-surface-dark p-2.5 rounded-full shadow-md border border-black/5">
                                 <button onClick={() => updateSet(exIdx, setIdx, 'weight', set.weight - 2.5)} className="size-16 bg-slate-50 dark:bg-background-dark rounded-full shadow-lg flex items-center justify-center text-slate-500 active:scale-75 active:bg-primary active:text-black transition-all shrink-0"><span className="material-symbols-outlined text-3xl font-black">remove</span></button>
                                 <input type="number" step="0.5" value={set.weight} onChange={(e) => updateSet(exIdx, setIdx, 'weight', parseFloat(e.target.value))} className="flex-1 bg-transparent border-0 text-center font-black text-5xl focus:ring-0 tabular-nums p-0 min-w-0 text-slate-900 dark:text-white appearance-none" />
                                 <button onClick={() => updateSet(exIdx, setIdx, 'weight', set.weight + 2.5)} className="size-16 bg-slate-50 dark:bg-background-dark rounded-full shadow-lg flex items-center justify-center text-slate-500 active:scale-75 active:bg-primary active:text-black transition-all shrink-0"><span className="material-symbols-outlined text-3xl font-black">add</span></button>
                              </div>
                           </div>

                           <div className="space-y-3">
                              <div className="flex justify-between items-center px-4">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Repeticiones</span>
                                <span className="text-[9px] font-black text-primary uppercase bg-black dark:bg-white/10 px-2 py-0.5 rounded-md">Volumen</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 bg-white dark:bg-surface-dark p-2.5 rounded-full shadow-md border border-black/5">
                                 <button onClick={() => updateSet(exIdx, setIdx, 'reps', set.reps - 1)} className="size-16 bg-slate-50 dark:bg-background-dark rounded-full shadow-lg flex items-center justify-center text-slate-500 active:scale-75 active:bg-primary active:text-black transition-all shrink-0"><span className="material-symbols-outlined text-3xl font-black">remove</span></button>
                                 <input type="number" value={set.reps} onChange={(e) => updateSet(exIdx, setIdx, 'reps', parseInt(e.target.value))} className="flex-1 bg-transparent border-0 text-center font-black text-5xl focus:ring-0 tabular-nums p-0 min-w-0 text-slate-900 dark:text-white appearance-none" />
                                 <button onClick={() => updateSet(exIdx, setIdx, 'reps', set.reps + 1)} className="size-16 bg-slate-50 dark:bg-background-dark rounded-full shadow-lg flex items-center justify-center text-slate-500 active:scale-75 active:bg-primary active:text-black transition-all shrink-0"><span className="material-symbols-outlined text-3xl font-black">add</span></button>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => {
                        const updated = [...selectedExercises];
                        const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1];
                        updated[exIdx].sets.push({ ...lastSet });
                        setSelectedExercises(updated);
                      }}
                      className="w-full py-8 rounded-[2.5rem] border-4 border-dashed border-slate-200 dark:border-white/5 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] active:bg-primary/5 active:border-primary/30 transition-all flex items-center justify-center gap-3"
                    >
                      <span className="material-symbols-outlined text-xl">add_circle</span>
                      Añadir Serie Extra
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-32 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[4rem] flex flex-col items-center justify-center text-slate-300 gap-8 opacity-50">
                 <div className="size-24 rounded-[3rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-6xl">inventory</span>
                 </div>
                 <p className="text-[11px] font-black uppercase tracking-[0.4em] max-w-[200px] text-center leading-relaxed">Configura tus ejercicios para registrar la sesión</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent z-40">
        <button 
          onClick={handleSave} 
          disabled={selectedExercises.length === 0 || isFutureDate}
          className="w-full h-24 bg-primary text-black rounded-full font-black text-xl shadow-[0_20px_50px_rgba(255,239,10,0.3)] active:scale-95 transition-all disabled:opacity-30 uppercase tracking-[0.25em] flex items-center justify-center gap-4"
        >
          <span className="material-symbols-outlined font-black text-3xl">save</span>
          REGISTRAR AHORA
        </button>
      </div>

      {showSelector && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-end animate-in fade-in duration-300">
          <div onClick={() => { setShowSelector(false); setIsCreatingNew(false); }} className="absolute inset-0"></div>
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 relative">
            <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-5 mb-2 opacity-50"></div>
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-3xl font-black tracking-tighter">{isCreatingNew ? 'Personalizado' : 'Biblioteca'}</h3>
              <button onClick={() => setShowSelector(false)} className="px-8 py-4 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-90">Cerrar</button>
            </div>
            <div className="px-8 py-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input type="text" placeholder="Busca en el catálogo..." className="w-full bg-slate-100 dark:bg-background-dark border-0 rounded-[2rem] py-6 pl-16 pr-8 font-bold text-xl focus:ring-4 focus:ring-primary/20 transition-all shadow-inner" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if (isCreatingNew && e.target.value === '') setIsCreatingNew(false); }} autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-4 no-scrollbar">
              {isCreatingNew ? (
                <div className="space-y-10 animate-in slide-in-from-right-4 pt-4">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Patrón de Movimiento</label>
                    <div className="flex flex-wrap gap-2">
                      {['Push', 'Pull', 'Legs', 'Core'].map(c => (
                        <button key={c} onClick={() => { setNewExerciseCategory(c); setNewExerciseMuscle(CATEGORY_MUSCLE_MAP[c][0]); }} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${newExerciseCategory === c ? 'bg-primary border-primary text-black shadow-lg scale-105' : 'bg-slate-50 dark:bg-background-dark border-black/5 text-slate-400'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Músculo Principal</label>
                    <div className="flex flex-wrap gap-3">
                      {CATEGORY_MUSCLE_MAP[newExerciseCategory].map(m => (
                        <button key={m} onClick={() => setNewExerciseMuscle(m)} className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${newExerciseMuscle === m ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg scale-105' : 'bg-slate-50 dark:bg-background-dark border-black/5 text-slate-400'}`}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={createAndAddExercise} className="w-full py-8 rounded-[3rem] bg-primary text-black font-black text-xl shadow-[0_20px_50px_rgba(255,239,10,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4">
                    <span className="material-symbols-outlined text-3xl font-black">add_task</span>
                    CREAR Y AÑADIR
                  </button>
                </div>
              ) : (
                <>
                  {searchTerm.length > 0 && filteredLibrary.length === 0 && (
                    <button onClick={() => setIsCreatingNew(true)} className="w-full flex items-center gap-6 p-8 rounded-[3rem] bg-primary/10 border-4 border-dashed border-primary/40 text-left active:scale-[0.98] transition-all group">
                      <div className="size-20 rounded-[2.2rem] bg-primary flex items-center justify-center text-black shrink-0 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-4xl font-black">add_circle</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-2xl tracking-tighter leading-tight">Crear "{searchTerm}"</p>
                        <p className="text-[10px] font-black text-primary-text/60 uppercase tracking-widest mt-1">Nuevo ejercicio personalizado</p>
                      </div>
                    </button>
                  )}
                  {filteredLibrary.map((ex) => (
                    <div key={ex.id} className="w-full flex items-center gap-6 p-5 rounded-[3rem] bg-slate-50 dark:bg-white/5 border border-black/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer group" onClick={() => handleAddFromLibrary(ex)}>
                      <div className="size-16 rounded-[1.8rem] overflow-hidden bg-white dark:bg-surface-dark shadow-md shrink-0 border border-black/5">
                        <img src={ex.thumbnail || getMuscleDefaultImage(ex.muscleGroup)} alt={ex.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xl leading-tight truncate text-slate-900 dark:text-white">{ex.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1.5">{ex.muscleGroup}</p>
                      </div>
                      <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-black shrink-0 shadow-md group-hover:rotate-12 transition-transform">
                        <span className="material-symbols-outlined font-black text-2xl">add</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualLog;
