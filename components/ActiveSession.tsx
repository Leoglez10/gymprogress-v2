
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CustomRoutine, Exercise, CustomExerciseEntry, UserProfile } from '../types';

interface ActiveSessionProps {
  routine: CustomRoutine | null;
  onFinish: () => void;
  onCancel?: () => void;
  userProfile: UserProfile;
}

interface PerformanceSet {
  weight: number;
  reps: number;
  completed: boolean;
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ routine, onFinish, onCancel, userProfile }) => {
  const [sessionRoutine, setSessionRoutine] = useState<CustomRoutine | null>(routine);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [exerciseSets, setExerciseSets] = useState<PerformanceSet[]>([]);
  const [seconds, setSeconds] = useState(0);
  
  const [restDuration, setRestDuration] = useState(90);
  const [restSeconds, setRestSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [autoRestEnabled, setAutoRestEnabled] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('Pecho');

  const [translateY, setTranslateY] = useState(0);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    const savedState = localStorage.getItem('gymProgress_active_session_state');
    const savedLibrary = localStorage.getItem('gymProgress_exercises');
    
    if (savedLibrary) setLibrary(JSON.parse(savedLibrary));

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setSessionRoutine(parsed.routine);
        setCurrentExerciseIdx(parsed.currentExerciseIdx);
        setExerciseSets(parsed.exerciseSets);
        setSeconds(parsed.seconds);
        setRestSeconds(parsed.restSeconds);
        setIsResting(parsed.isResting);
        if (parsed.restDuration) setRestDuration(parsed.restDuration);
        if (parsed.autoRestEnabled !== undefined) setAutoRestEnabled(parsed.autoRestEnabled);
      } catch (e) {
        console.error("Error al restaurar sesión activa", e);
      }
    } else if (routine) {
      if (routine.exercises.length > 0) {
        setExerciseSets(routine.exercises[0].sets.map(s => ({
          weight: s.weight,
          reps: s.reps,
          completed: s.completed || false
        })));
      }
    }

    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (sessionRoutine) {
      const stateToSave = {
        routine: sessionRoutine,
        currentExerciseIdx,
        exerciseSets,
        seconds,
        restSeconds,
        isResting,
        restDuration,
        autoRestEnabled
      };
      localStorage.setItem('gymProgress_active_session_state', JSON.stringify(stateToSave));
    }
  }, [sessionRoutine, currentExerciseIdx, exerciseSets, seconds, restSeconds, isResting, restDuration, autoRestEnabled]);

  useEffect(() => {
    let interval: any;
    if (isResting && restSeconds > 0) {
      interval = setInterval(() => setRestSeconds(s => s - 1), 1000);
    } else if (restSeconds === 0 && isResting) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restSeconds]);

  const handleToggleSet = (idx: number) => {
    const updated = [...exerciseSets];
    updated[idx].completed = !updated[idx].completed;
    setExerciseSets(updated);

    if (updated[idx].completed && autoRestEnabled) {
      setRestSeconds(restDuration);
      setIsResting(true);
    }
  };

  const updateSetValue = (idx: number, field: 'weight' | 'reps', val: number) => {
    const updated = [...exerciseSets];
    const cleanValue = isNaN(val) ? 0 : Math.max(0, val);
    updated[idx][field] = cleanValue;
    setExerciseSets(updated);
  };

  const clearSessionStorage = () => {
    localStorage.removeItem('gymProgress_active_session_state');
  };

  const getUpdatedRoutineWithCurrentProgress = () => {
    if (!sessionRoutine) return null;
    const updatedExercises = [...sessionRoutine.exercises];
    // Asegurarnos de que el índice existe antes de actualizar
    if (updatedExercises[currentExerciseIdx]) {
      updatedExercises[currentExerciseIdx] = {
        ...updatedExercises[currentExerciseIdx],
        sets: exerciseSets.map(s => ({ weight: s.weight, reps: s.reps, completed: s.completed }))
      };
    }
    return { ...sessionRoutine, exercises: updatedExercises };
  };

  const nextExercise = () => {
    const updatedRoutine = getUpdatedRoutineWithCurrentProgress();
    if (!updatedRoutine) return;

    if (currentExerciseIdx < updatedRoutine.exercises.length - 1) {
      const nextIdx = currentExerciseIdx + 1;
      const nextExData = updatedRoutine.exercises[nextIdx];
      
      setSessionRoutine(updatedRoutine);
      setCurrentExerciseIdx(nextIdx);
      
      setExerciseSets(nextExData.sets.map(s => ({
        weight: s.weight,
        reps: s.reps,
        completed: s.completed || false
      })));
    } else {
      finishWorkout(updatedRoutine);
    }
  };

  const prevExercise = () => {
    const updatedRoutine = getUpdatedRoutineWithCurrentProgress();
    if (!updatedRoutine || currentExerciseIdx === 0) return;

    const prevIdx = currentExerciseIdx - 1;
    const prevExData = updatedRoutine.exercises[prevIdx];

    setSessionRoutine(updatedRoutine);
    setCurrentExerciseIdx(prevIdx);
    
    setExerciseSets(prevExData.sets.map(s => ({
      weight: s.weight,
      reps: s.reps,
      completed: s.completed || false
    })));
  };

  const finishWorkout = (finalRoutine: CustomRoutine) => {
    let totalVolume = 0;
    finalRoutine.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) totalVolume += (s.weight * s.reps);
      });
    });

    localStorage.setItem('gymProgress_last_session_volume', totalVolume.toString());
    localStorage.setItem('gymProgress_last_session_duration', seconds.toString());
    localStorage.setItem('gymProgress_last_session_data', JSON.stringify(finalRoutine));
    clearSessionStorage();
    onFinish();
  };

  const handleCancel = () => {
    clearSessionStorage();
    if (onCancel) onCancel();
  };

  const addNewExerciseFromLibrary = (ex: Exercise) => {
    const updatedRoutineWithCurrent = getUpdatedRoutineWithCurrentProgress() || sessionRoutine;
    if (!updatedRoutineWithCurrent) return;

    const newEntry: CustomExerciseEntry = {
      exerciseId: ex.id,
      name: ex.name,
      sets: [{ weight: 0, reps: 10, completed: false }]
    };

    const finalRoutine = {
      ...updatedRoutineWithCurrent,
      exercises: [...updatedRoutineWithCurrent.exercises, newEntry]
    };

    setSessionRoutine(finalRoutine);
    const newIdx = finalRoutine.exercises.length - 1;
    setCurrentExerciseIdx(newIdx);
    setExerciseSets([{ weight: 0, reps: 10, completed: false }]);
    
    setShowExerciseSelector(false);
    setIsCreatingNew(false);
    setSearchTerm('');
  };

  const createAndAddExercise = () => {
    if (!searchTerm.trim()) return;
    const newEx: Exercise = {
      id: `custom_${Date.now()}`,
      name: searchTerm,
      muscleGroup: newExerciseMuscle,
      type: 'Strength',
      thumbnail: ''
    };
    const updatedLibrary = [newEx, ...library];
    setLibrary(updatedLibrary);
    localStorage.setItem('gymProgress_exercises', JSON.stringify(updatedLibrary));
    addNewExerciseFromLibrary(newEx);
  };

  const duplicateSet = (idx: number) => {
    const updated = [...exerciseSets];
    const setToDuplicate = { ...updated[idx], completed: false };
    updated.splice(idx + 1, 0, setToDuplicate);
    setExerciseSets(updated);
  };

  const removeSet = (idx: number) => {
    if (exerciseSets.length <= 1) return;
    setExerciseSets(exerciseSets.filter((_, i) => i !== idx));
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;
    if (diff > 0) setTranslateY(diff * 0.5);
  };
  const handleTouchEnd = () => {
    if (translateY > 150) handleCancel(); else setTranslateY(0);
    touchStartRef.current = null;
  };

  const filteredLibrary = useMemo(() => {
    return library.filter(ex => 
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [library, searchTerm]);

  const totalProgress = useMemo(() => {
    if (!sessionRoutine || sessionRoutine.exercises.length === 0) return 0;
    const totalExercises = sessionRoutine.exercises.length;
    const completedSetsInCurrent = exerciseSets.filter(s => s.completed).length;
    const totalSetsInCurrent = exerciseSets.length || 1;
    const progressValue = ((currentExerciseIdx + (completedSetsInCurrent / totalSetsInCurrent)) / totalExercises) * 100;
    return Math.min(100, Math.round(progressValue));
  }, [currentExerciseIdx, exerciseSets, sessionRoutine]);

  if (!sessionRoutine) return null;
  const currentExercise = sessionRoutine.exercises[currentExerciseIdx];
  const formatTime = (s: number) => new Date(s * 1000).toISOString().substr(11, 8);
  const muscleChips = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio'];

  return (
    <div 
      className="h-full flex flex-col bg-background-light dark:bg-background-dark overflow-hidden relative transition-transform duration-300 ease-out"
      style={{ transform: `translateY(${translateY}px)` }}
    >
      {isResting && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-top duration-300">
           <div className="bg-black/90 text-white px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl border border-white/20 backdrop-blur-md">
              <span className="material-symbols-outlined text-primary text-xl animate-pulse">timer</span>
              <span className="text-xl font-black tabular-nums">{restSeconds}s</span>
              <button onClick={() => setIsResting(false)} className="text-[10px] font-black uppercase text-primary tracking-widest ml-2 bg-white/10 px-3 py-1 rounded-full">Saltar</button>
           </div>
        </div>
      )}

      <header className="px-4 pt-4 pb-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md z-30 border-b border-black/5 pt-[env(safe-area-inset-top)]" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className="size-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 border border-black/5 transition-all active:scale-90">
              <span className="material-symbols-outlined">close</span>
            </button>
            <button onClick={() => setShowConfig(true)} className={`size-10 rounded-xl flex items-center justify-center shadow-sm border transition-all active:scale-90 ${autoRestEnabled ? 'bg-primary text-black border-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-black/5'}`}>
              <span className="material-symbols-outlined text-[24px]">timer</span>
            </button>
          </div>
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">En Vivo</span>
            <div className="text-2xl font-black tabular-nums leading-none mt-0.5">{formatTime(seconds)}</div>
          </div>
          <button onClick={nextExercise} className="px-5 py-2.5 bg-primary rounded-full text-black text-xs font-black shadow-lg active:scale-95 transition-all" disabled={sessionRoutine.exercises.length === 0}>
            {currentExerciseIdx === sessionRoutine.exercises.length - 1 ? 'Hecho' : 'Sig.'}
          </button>
        </div>
        <div className="w-full h-1 bg-slate-100 dark:bg-white/5 relative overflow-hidden rounded-full mb-2">
          <div className="absolute left-0 top-0 h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${totalProgress}%` }}></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pt-6 pb-48">
        {!currentExercise ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in zoom-in-95 duration-500">
            <div className="size-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary mb-8 shadow-inner animate-pulse">
              <span className="material-symbols-outlined text-6xl fill-1">play_circle</span>
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tighter">Sesión Iniciada</h2>
            <button onClick={() => { setIsCreatingNew(false); setShowExerciseSelector(true); }} className="w-full py-7 rounded-[2.5rem] bg-primary text-black font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
              <span className="material-symbols-outlined font-black text-2xl">add_circle</span>
              Añadir Ejercicio
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300" key={currentExercise.exerciseId + currentExerciseIdx}>
            <div className="mb-6 flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-4">
                <h1 className="text-2xl font-black leading-tight tracking-tighter truncate">{currentExercise.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-black text-primary-text uppercase tracking-widest bg-primary px-2.5 py-0.5 rounded-full">Serie Actual: {exerciseSets.filter(s => s.completed).length + 1}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-full">{currentExerciseIdx + 1} / {sessionRoutine.exercises.length}</span>
                </div>
              </div>
              <button onClick={prevExercise} disabled={currentExerciseIdx === 0} className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 disabled:opacity-30">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
            </div>

            <div className="space-y-6">
              {exerciseSets.map((set, idx) => (
                <div key={idx} className={`relative overflow-hidden bg-white dark:bg-surface-dark rounded-[2.5rem] p-5 shadow-lg border-2 transition-all duration-300 ${set.completed ? 'border-green-500 bg-green-50/20 dark:bg-green-950/20' : 'border-black/5'}`}>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-lg flex items-center justify-center font-black text-sm ${set.completed ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-background-dark text-slate-400'}`}>{idx + 1}</div>
                      <h3 className="font-black text-[9px] uppercase tracking-widest text-slate-400">Control de Serie</h3>
                    </div>
                    <div className="flex gap-2">
                       {/* BOTÓN DUPLICAR SERIE EN VIVO */}
                       <button 
                        onClick={() => duplicateSet(idx)} 
                        title="Duplicar serie"
                        className="size-10 flex items-center justify-center rounded-xl bg-primary text-black transition-all duration-300 active:scale-90 shadow-md hover:scale-105"
                      >
                        <span className="material-symbols-outlined text-[20px] font-black">content_copy</span>
                      </button>
                      <button onClick={() => removeSet(idx)} className="size-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 transition-all">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4 transition-colors group-focus-within:text-primary">Carga ({userProfile.weightUnit})</span>
                        <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-background-dark/50 p-2 rounded-full shadow-inner border border-black/5">
                          <button onClick={() => updateSetValue(idx, 'weight', set.weight - 2.5)} className="size-16 bg-white dark:bg-surface-dark rounded-full shadow-md flex items-center justify-center active:scale-75 transition-all text-slate-500 shrink-0">
                            <span className="material-symbols-outlined text-3xl font-black">remove</span>
                          </button>
                          <input type="number" min="0" step="0.5" value={set.weight} onChange={(e) => updateSetValue(idx, 'weight', parseFloat(e.target.value) || 0)} className="flex-1 bg-transparent border-0 text-center font-black text-4xl focus:ring-0 tabular-nums p-0 min-w-0" />
                          <button onClick={() => updateSetValue(idx, 'weight', set.weight + 2.5)} className="size-16 bg-white dark:bg-surface-dark rounded-full shadow-md flex items-center justify-center active:scale-75 transition-all text-slate-500 shrink-0">
                            <span className="material-symbols-outlined text-3xl font-black">add</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Repeticiones</span>
                        <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-background-dark/50 p-2 rounded-full shadow-inner border border-black/5">
                          <button onClick={() => updateSetValue(idx, 'reps', set.reps - 1)} className="size-16 bg-white dark:bg-surface-dark rounded-full shadow-md flex items-center justify-center active:scale-75 transition-all text-slate-500 shrink-0">
                            <span className="material-symbols-outlined text-3xl font-black">remove</span>
                          </button>
                          <input type="number" min="0" value={set.reps} onChange={(e) => updateSetValue(idx, 'reps', parseInt(e.target.value) || 0)} className="flex-1 bg-transparent border-0 text-center font-black text-4xl focus:ring-0 tabular-nums p-0 min-w-0" />
                          <button onClick={() => updateSetValue(idx, 'reps', set.reps + 1)} className="size-16 bg-white dark:bg-surface-dark rounded-full shadow-md flex items-center justify-center active:scale-75 transition-all text-slate-500 shrink-0">
                            <span className="material-symbols-outlined text-3xl font-black">add</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <button onClick={() => handleToggleSet(idx)} className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg ${set.completed ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-black dark:bg-white text-white dark:text-black shadow-black/10'}`}>
                      {set.completed ? '¡Completada!' : 'Marcar Serie'}
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => setExerciseSets([...exerciseSets, { weight: exerciseSets[exerciseSets.length-1]?.weight || 0, reps: 10, completed: false }])} className="w-full py-6 rounded-[2rem] border-4 border-dashed border-slate-200 dark:border-white/5 text-[9px] font-black uppercase text-slate-400 tracking-widest active:bg-slate-50 transition-all">
                + Añadir serie extra
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent z-40">
        <div className="flex gap-4">
          <button onClick={() => { setIsCreatingNew(false); setShowExerciseSelector(true); }} className="size-16 bg-white dark:bg-surface-dark text-slate-400 rounded-full shadow-2xl flex items-center justify-center border-4 border-primary active:scale-95 transition-all shrink-0">
            <span className="material-symbols-outlined text-3xl">add</span>
          </button>
          <button onClick={nextExercise} disabled={sessionRoutine.exercises.length === 0} className="flex-1 h-16 bg-primary text-black rounded-2xl font-black text-lg shadow-2xl active:scale-95 transition-all disabled:opacity-50 tracking-tight">
            {currentExerciseIdx === sessionRoutine.exercises.length - 1 ? 'FINALIZAR SESIÓN' : 'SIGUIENTE EJERCICIO'}
          </button>
        </div>
      </footer>

      {/* MODAL: SELECTOR DE EJERCICIOS (SOLUCIONADO) */}
      {showExerciseSelector && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-end animate-in fade-in duration-300">
          <div onClick={() => { setShowExerciseSelector(false); setIsCreatingNew(false); }} className="absolute inset-0"></div>
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 relative">
            <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-5 mb-2 opacity-50"></div>
            
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-3xl font-black tracking-tighter">{isCreatingNew ? 'Nuevo' : 'Biblioteca'}</h3>
              <button onClick={() => setShowExerciseSelector(false)} className="px-8 py-4 rounded-full bg-primary text-black text-sm font-black active:scale-95 transition-all">CERRAR</button>
            </div>

            <div className="px-8 py-4">
              <input 
                type="text" 
                placeholder="Busca un ejercicio..."
                className="w-full bg-slate-100 dark:bg-background-dark border-0 rounded-3xl py-6 px-8 font-bold text-xl focus:ring-4 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); if (isCreatingNew && e.target.value === '') setIsCreatingNew(false); }}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-4 no-scrollbar">
              {isCreatingNew ? (
                <div className="space-y-10 animate-in slide-in-from-right-4">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Grupo Muscular</label>
                    <div className="flex flex-wrap gap-3">
                      {muscleChips.map(m => (
                        <button key={m} onClick={() => setNewExerciseMuscle(m)} className={`px-6 py-4 rounded-2xl text-xs font-black transition-all border-2 ${newExerciseMuscle === m ? 'bg-primary border-primary text-black shadow-lg' : 'bg-transparent border-black/5 text-slate-400'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={createAndAddExercise} className="w-full py-8 rounded-[2.5rem] bg-black dark:bg-white text-white dark:text-black font-black text-xl shadow-xl active:scale-95 transition-all">
                    AÑADIR A LA SESIÓN
                  </button>
                </div>
              ) : (
                <>
                  {searchTerm.length > 0 && filteredLibrary.length === 0 && (
                    <button onClick={() => setIsCreatingNew(true)} className="w-full flex items-center gap-6 p-8 rounded-[3rem] bg-primary/10 border-4 border-dashed border-primary/40 text-left active:scale-[0.98] transition-all">
                      <div className="size-20 rounded-[2rem] bg-primary flex items-center justify-center text-black shrink-0">
                        <span className="material-symbols-outlined text-4xl font-black">add</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-2xl tracking-tight leading-none">Crear "{searchTerm}"</p>
                      </div>
                    </button>
                  )}

                  {filteredLibrary.map((ex) => (
                    <div key={ex.id} className="w-full flex items-center gap-6 p-5 rounded-[3rem] bg-slate-50 dark:bg-white/5 border border-black/5 shadow-sm active:scale-95 transition-all cursor-pointer" onClick={() => addNewExerciseFromLibrary(ex)}>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-xl leading-tight truncate">{ex.name}</p>
                        <p className="text-[11px] text-slate-400 uppercase font-black tracking-widest mt-1">{ex.muscleGroup}</p>
                      </div>
                      <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-black shrink-0 shadow-md">
                        <span className="material-symbols-outlined font-black">add</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURACIÓN DE DESCANSO */}
      {showConfig && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div onClick={() => setShowConfig(false)} className="absolute inset-0"></div>
           <div className="w-full max-w-xs bg-white dark:bg-surface-dark rounded-[3rem] p-8 shadow-2xl flex flex-col items-center text-center gap-8 animate-in zoom-in-95 relative">
              <h3 className="text-xl font-black tracking-tight">Temporizador</h3>
              <div className="flex flex-col w-full gap-4">
                 <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold">Auto-Descanso</span>
                    <button onClick={() => setAutoRestEnabled(!autoRestEnabled)} className={`w-14 h-7 rounded-full transition-colors relative ${autoRestEnabled ? 'bg-primary' : 'bg-slate-200'}`}>
                       <div className={`absolute top-1 size-5 bg-white rounded-full shadow-sm transition-all ${autoRestEnabled ? 'left-8' : 'left-1'}`}></div>
                    </button>
                 </div>
                 <div className="space-y-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duración: {restDuration}s</span>
                    <input type="range" min="30" max="300" step="15" value={restDuration} onChange={(e) => setRestDuration(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" />
                 </div>
              </div>
              <button onClick={() => setShowConfig(false)} className="w-full py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-sm active:scale-95 transition-all">LISTO</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSession;
