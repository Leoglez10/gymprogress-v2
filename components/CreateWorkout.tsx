
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Exercise, CustomRoutine, CustomExerciseEntry, UserProfile } from '../types';
import { getMuscleDefaultImage } from './ExerciseLibrary';

interface CreateWorkoutProps {
  onBack: () => void;
  onSave: () => void;
  initialRoutineId?: string;
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

const CreateWorkout: React.FC<CreateWorkoutProps> = ({ onBack, onSave, initialRoutineId, userProfile }) => {
  const [workoutId, setWorkoutId] = useState<string>(initialRoutineId || '');
  const [workoutName, setWorkoutName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<UIExerciseEntry[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [animatingSetIdx, setAnimatingSetIdx] = useState<number | null>(null);
  
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newExerciseCategory, setNewExerciseCategory] = useState<any>('Push');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('Pecho');
  
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);

  useEffect(() => {
    const savedLibrary = localStorage.getItem('gymProgress_exercises');
    if (savedLibrary) setLibrary(JSON.parse(savedLibrary));
    
    const history = localStorage.getItem('gymProgress_workout_history');
    if (history) setWorkoutHistory(JSON.parse(history));

    const routines = JSON.parse(localStorage.getItem('gymProgress_custom_routines') || '[]');
    if (initialRoutineId) {
      const existing = routines.find((r: CustomRoutine) => r.id === initialRoutineId);
      if (existing) {
        setWorkoutName(existing.name);
        setSelectedExercises(existing.exercises.map((ex, idx) => ({ ...ex, uiId: `ui-${ex.exerciseId}-${idx}-${Date.now()}` })));
      }
    }
  }, [initialRoutineId]);

  const progressionMap = useMemo(() => {
    const map: Record<string, { weight: number, date: string }[]> = {};
    const sortedHistory = [...workoutHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedHistory.forEach(session => {
      if (session.exercises && Array.isArray(session.exercises)) {
        session.exercises.forEach((ex: any) => {
          if (!ex.sets || !Array.isArray(ex.sets)) return;
          const completedWeights = ex.sets
            .filter((s: any) => s.completed || s.weight > 0)
            .map((s: any) => Number(s.weight) || 0);
          
          if (completedWeights.length > 0) {
            const maxWeight = Math.max(...completedWeights);
            if (maxWeight > 0) {
              const exIdStr = String(ex.exerciseId);
              if (!map[exIdStr]) map[exIdStr] = [];
              map[exIdStr].push({ 
                weight: maxWeight, 
                date: new Date(session.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) 
              });
            }
          }
        });
      }
    });
    return map;
  }, [workoutHistory]);

  const handleScroll = () => {
    if (scrollRef.current && draggedItemIndex === null) {
      const { scrollLeft, offsetWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / (offsetWidth * 0.85));
      setActiveIndex(index);
    }
  };

  const filteredLibrary = useMemo(() => {
    return library.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()) || ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [library, searchTerm]);

  const handleAddFromLibrary = (exercise: Exercise) => {
    const newEntry: UIExerciseEntry = { exerciseId: exercise.id, name: exercise.name, sets: [{ reps: 10, weight: 0 }], uiId: `ui-${exercise.id}-${Date.now()}` };
    setSelectedExercises(prev => [...prev, newEntry]);
    setAddedFeedback(exercise.id);
    setToastMessage(`¡${exercise.name} añadido!`);
    setTimeout(() => { setAddedFeedback(null); setToastMessage(null); }, 2000);
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' }); }, 100);
  };

  const handleNewCategoryChange = (newCat: any) => {
    const validMuscles = CATEGORY_MUSCLE_MAP[newCat];
    const isCurrentMuscleValid = validMuscles.includes(newExerciseMuscle);
    setNewExerciseCategory(newCat);
    setNewExerciseMuscle(isCurrentMuscleValid ? newExerciseMuscle : validMuscles[0]);
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
      type: 'Strength',
      thumbnail: getMuscleDefaultImage(newExerciseMuscle)
    };
    const updatedLibrary = [newEx, ...library];
    setLibrary(updatedLibrary);
    localStorage.setItem('gymProgress_exercises', JSON.stringify(updatedLibrary));
    handleAddFromLibrary(newEx);
    setIsCreatingNew(false);
    setSearchTerm('');
  };

  const updateSet = (exerciseIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) => {
    const updated = [...selectedExercises];
    let cleanValue = isNaN(value) ? 0 : Math.max(0, value);
    if (field === 'weight') {
      cleanValue = Math.min(1000, cleanValue);
    } else {
      cleanValue = Math.min(999, Math.round(cleanValue));
    }
    updated[exerciseIdx].sets[setIdx] = { ...updated[exerciseIdx].sets[setIdx], [field]: cleanValue };
    setSelectedExercises(updated);
  };

  const addSet = (exerciseIdx: number) => {
    const updated = [...selectedExercises];
    const lastSet = updated[exerciseIdx].sets[updated[exerciseIdx].sets.length - 1];
    updated[exerciseIdx].sets.push({ ...lastSet });
    setSelectedExercises(updated);
    setAnimatingSetIdx(exerciseIdx);
    setTimeout(() => setAnimatingSetIdx(null), 800);
  };

  const duplicateSet = (exerciseIdx: number, setIdx: number) => {
    const updated = [...selectedExercises];
    const setToDuplicate = { ...updated[exerciseIdx].sets[setIdx] };
    updated[exerciseIdx].sets.splice(setIdx + 1, 0, setToDuplicate);
    setSelectedExercises(updated);
    setAnimatingSetIdx(exerciseIdx);
    setTimeout(() => setAnimatingSetIdx(null), 800);
  };

  const removeSet = (exerciseIdx: number, setIdx: number) => {
    if (selectedExercises[exerciseIdx].sets.length <= 1) return;
    const updated = [...selectedExercises];
    updated[exerciseIdx].sets = updated[exerciseIdx].sets.filter((_, i) => i !== setIdx);
    setSelectedExercises(updated);
  };

  const removeExercise = (index: number) => { setSelectedExercises(selectedExercises.filter((_, i) => i !== index)); };
  
  const onDragStart = (e: React.DragEvent, index: number) => { 
    setDraggedItemIndex(index); 
    e.dataTransfer.effectAllowed = 'move'; 
    e.dataTransfer.setData('text/plain', index.toString()); 
    document.body.classList.add('dragging-active'); 
  };
  
  const onDragOver = (e: React.DragEvent, index: number) => { 
    e.preventDefault(); 
    if (draggedItemIndex === null || draggedItemIndex === index) return; 
    const newList = [...selectedExercises]; 
    const draggedItem = newList[draggedItemIndex]; 
    newList.splice(draggedItemIndex, 1); 
    newList.splice(index, 0, draggedItem); 
    setDraggedItemIndex(index); 
    setSelectedExercises(newList); 
    setActiveIndex(index); 
  };
  
  const onDragEnd = () => { 
    setDraggedItemIndex(null); 
    document.body.classList.remove('dragging-active'); 
  };

  const handleSave = () => {
    if (!workoutName || selectedExercises.length === 0) return;
    const routines = JSON.parse(localStorage.getItem('gymProgress_custom_routines') || '[]');
    const cleanExercises = selectedExercises.map(({ uiId, ...rest }) => rest);
    const newRoutine: CustomRoutine = { id: workoutId || `routine_${Date.now()}`, name: workoutName, exercises: cleanExercises };
    let updatedRoutines = workoutId ? routines.map((r: CustomRoutine) => r.id === workoutId ? newRoutine : r) : [newRoutine, ...routines];
    localStorage.setItem('gymProgress_custom_routines', JSON.stringify(updatedRoutines));
    onSave();
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background-light dark:bg-background-dark font-display relative overflow-hidden">
      <div className="flex items-center px-4 py-3 sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5 pt-[env(safe-area-inset-top)]">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-black flex-1 text-center pr-10">Diseñar Rutina</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pb-44">
        <div className="px-5 pt-6 space-y-3">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em]">Nombre Rutina</label>
          <input type="text" placeholder="Ej: Torso A..." className="w-full bg-white dark:bg-surface-dark border-0 ring-1 ring-black/5 dark:ring-white/10 rounded-[1.5rem] py-5 px-6 text-xl font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-primary shadow-sm transition-all" value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-6">
            <h3 className="font-black text-lg tracking-tight">Ejercicios</h3>
            <span className={`bg-primary text-black text-[10px] font-black px-3 py-1 rounded-full uppercase transition-all duration-300 ${toastMessage ? 'scale-125 rotate-3' : 'scale-100 rotate-0'}`}>{selectedExercises.length}</span>
          </div>

          {selectedExercises.length === 0 ? (
            <div className="mx-6 py-20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 gap-4">
              <span className="material-symbols-outlined text-6xl opacity-20">inventory_2</span>
              <p className="text-xs font-black uppercase tracking-widest opacity-40">Añade tu primer ejercicio</p>
            </div>
          ) : (
            <>
              <div ref={scrollRef} onScroll={handleScroll} className={`flex overflow-x-auto no-scrollbar gap-4 px-6 pb-4 ${draggedItemIndex !== null ? 'snap-none' : 'snap-x snap-mandatory'}`}>
                {selectedExercises.map((entry, exIdx) => {
                  const progression = progressionMap[String(entry.exerciseId)] || [];
                  return (
                    <div key={entry.uiId} draggable onDragStart={(e) => onDragStart(e, exIdx)} onDragOver={(e) => onDragOver(e, exIdx)} onDragEnd={onDragEnd} className={`snap-center shrink-0 w-[88vw] bg-white dark:bg-surface-dark rounded-[3rem] p-6 shadow-xl border transition-all duration-300 relative flex flex-col ${draggedItemIndex === exIdx ? 'border-primary ring-4 ring-primary/10 z-[100] scale-[1.02] shadow-2xl opacity-80 rotate-1' : 'border-black/5 dark:border-white/5'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="cursor-grab active:cursor-grabbing text-primary transition-all p-2 rounded-xl bg-primary/5 shrink-0">
                            <span className="material-symbols-outlined text-2xl font-black">drag_indicator</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-xl leading-tight truncate">{entry.name}</h4>
                          </div>
                        </div>
                        <button onClick={() => removeExercise(exIdx)} className="size-10 flex items-center justify-center rounded-full text-slate-200 hover:text-red-500 transition-all shrink-0">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>

                      <div className="mb-6 h-28 w-full bg-slate-50 dark:bg-background-dark/50 rounded-[2rem] border border-black/5 p-3 overflow-hidden">
                         {progression.length > 1 ? (
                           <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={progression}>
                               <defs>
                                 <linearGradient id={`colorProg-${entry.uiId}`} x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#FFEF0A" stopOpacity={0.4}/>
                                   <stop offset="95%" stopColor="#FFEF0A" stopOpacity={0}/>
                                 </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                               <XAxis dataKey="date" hide={true} />
                               <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                               <Tooltip content={({ active, payload }) => (active && payload ? <div className="bg-black text-white px-3 py-1.5 rounded-xl text-[10px] font-black">{payload[0].value} kg</div> : null)} />
                               <Area type="monotone" dataKey="weight" stroke="#FFEF0A" strokeWidth={3} fill={`url(#colorProg-${entry.uiId})`} dot={{ r: 3, fill: '#FFEF0A' }} />
                             </AreaChart>
                           </ResponsiveContainer>
                         ) : (
                           <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                              <span className="material-symbols-outlined text-2xl mb-1">query_stats</span>
                              <p className="text-[8px] font-black uppercase tracking-widest">Sin historial suficiente</p>
                           </div>
                         )}
                      </div>

                      <div className="flex-1 space-y-6 max-h-[40vh] overflow-y-auto no-scrollbar pr-1">
                        {entry.sets.map((set, setIdx) => (
                          <div key={setIdx} className={`space-y-4 p-5 bg-slate-50 dark:bg-background-dark/50 rounded-[2.5rem] border border-black/5 relative shadow-inner transition-all duration-500 ${setIdx === entry.sets.length - 1 && animatingSetIdx === exIdx ? 'animate-in fade-in slide-in-from-bottom-4 zoom-in-95' : ''}`}>
                            <div className="flex items-center justify-between px-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Serie {setIdx + 1}</span>
                              <div className="flex items-center gap-2">
                                <button onClick={() => duplicateSet(exIdx, setIdx)} title="Duplicar serie" className="size-11 flex items-center justify-center rounded-2xl bg-primary text-black transition-all duration-300 active:scale-95 shadow-lg shadow-primary/20"><span className="material-symbols-outlined text-[24px] font-black">content_copy</span></button>
                                <button onClick={() => removeSet(exIdx, setIdx)} title="Eliminar serie" className="size-11 flex items-center justify-center rounded-2xl text-slate-300 hover:text-red-500 transition-all"><span className="material-symbols-outlined text-[24px]">close</span></button>
                              </div>
                            </div>
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4 transition-colors">Carga ({userProfile.weightUnit})</span>
                                <div className="flex items-center justify-between gap-3 bg-white dark:bg-surface-dark p-2 rounded-full shadow-sm border border-black/5 overflow-hidden">
                                  <button onClick={() => updateSet(exIdx, setIdx, 'weight', set.weight - 2.5)} className="size-16 bg-slate-50 dark:bg-background-dark rounded-full flex items-center justify-center text-slate-500 active:bg-primary active:text-black transition-all active:scale-75 shrink-0"><span className="material-symbols-outlined text-3xl font-black">remove</span></button>
                                  <input type="number" min="0" max="1000" className="flex-1 bg-transparent border-0 p-0 text-center font-black text-3xl focus:ring-0 tabular-nums min-w-0" value={set.weight} onChange={(e) => updateSet(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)} />
                                  <button onClick={() => updateSet(exIdx, setIdx, 'weight', set.weight + 2.5)} className="size-16 bg-slate-50 dark:bg-background-dark rounded-full flex items-center justify-center text-slate-500 active:bg-primary active:text-black transition-all active:scale-75 shrink-0"><span className="material-symbols-outlined text-3xl font-black">add</span></button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-4">Repeticiones</span>
                                <div className="flex items-center justify-between gap-3 bg-white dark:bg-surface-dark p-2 rounded-full shadow-sm border border-black/5 overflow-hidden">
                                  <button onClick={() => updateSet(exIdx, setIdx, 'reps', set.reps - 1)} className="size-16 bg-slate-50 dark:bg-background-dark rounded-full flex items-center justify-center text-slate-500 active:bg-primary active:text-black transition-all active:scale-75 shrink-0"><span className="material-symbols-outlined text-3xl font-black">remove</span></button>
                                  <input type="number" min="0" max="999" className="flex-1 bg-transparent border-0 p-0 text-center font-black text-3xl focus:ring-0 tabular-nums min-w-0" value={set.reps} onChange={(e) => updateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)} /><button onClick={() => updateSet(exIdx, setIdx, 'reps', set.reps + 1)} className="size-16 bg-slate-50 dark:bg-background-dark rounded-full flex items-center justify-center text-slate-500 active:bg-primary active:text-black transition-all active:scale-75 shrink-0"><span className="material-symbols-outlined text-3xl font-black">add</span></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="relative mt-6">
                        {animatingSetIdx === exIdx && (<div className="absolute left-1/2 -top-12 -translate-x-1/2 bg-primary text-black size-10 rounded-full flex items-center justify-center font-black text-xs shadow-xl animate-out fade-out slide-out-to-top-12 duration-700 pointer-events-none z-50">+1</div>)}
                        <button onClick={() => addSet(exIdx)} className="w-full py-5 rounded-[2rem] border-4 border-dashed border-slate-200 dark:border-white/10 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] transition-all active:scale-95 active:border-primary active:text-primary">+ Añadir serie</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-2 pb-4">
                {selectedExercises.map((_, idx) => (<div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-8 bg-primary' : 'w-1.5 bg-slate-200'}`}></div>))}
              </div>
            </>
          )}
          
          <div className="px-6">
            <button 
              onClick={() => { setIsCreatingNew(false); setShowSelector(true); }} 
              className="w-full relative group overflow-hidden bg-white dark:bg-surface-dark border-2 border-primary/20 rounded-[3rem] p-8 shadow-sm transition-all duration-300 active:scale-[0.97]"
            >
              <div className="flex flex-col items-center gap-5">
                <div className="size-16 rounded-full bg-primary text-black flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-3xl font-black">add</span>
                </div>
                <div className="text-center">
                  <h4 className="font-black text-lg tracking-tighter uppercase leading-none">Explorar Catálogo</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-70">Añadir ejercicios a tu plan</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent z-40 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button onClick={() => setShowSaveConfirm(true)} disabled={!workoutName || selectedExercises.length === 0} className="w-full h-20 bg-primary text-black font-black text-xl rounded-full shadow-2xl active:scale-95 transition-all disabled:opacity-50">
          {workoutId ? 'Actualizar Rutina' : 'Guardar Rutina'}
        </button>
      </div>

      {/* MODAL DE SELECCIÓN DE EJERCICIOS - OPTIMIZADO PARA MÓVIL */}
      {showSelector && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-end animate-in fade-in duration-300">
          <div onClick={() => { setShowSelector(false); setIsCreatingNew(false); }} className="absolute inset-0"></div>
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[3.5rem] h-[92dvh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 relative">
            <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-5 mb-2 opacity-50 shrink-0"></div>
            
            <div className="p-6 sm:p-8 pb-4 flex items-center justify-between shrink-0">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tighter">{isCreatingNew ? 'Nuevo' : 'Biblioteca'}</h3>
              <button onClick={() => { setShowSelector(false); setIsCreatingNew(false); }} className="px-6 py-3 rounded-full bg-primary text-black text-xs font-black transition-all active:scale-90">LISTO</button>
            </div>

            <div className="px-6 sm:p-8 py-4 shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input type="text" placeholder="Busca un ejercicio..." className="w-full bg-slate-100 dark:bg-background-dark border-0 rounded-3xl py-5 pl-14 pr-6 font-bold text-lg focus:ring-4 focus:ring-primary/20" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if (isCreatingNew && e.target.value === '') setIsCreatingNew(false); }} autoFocus />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-32 space-y-6 no-scrollbar">
              {isCreatingNew ? (
                <div className="space-y-8 animate-in slide-in-from-right-4 pb-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patrón de Movimiento</label>
                    <div className="flex flex-wrap gap-2">
                      {['Push', 'Pull', 'Legs', 'Core'].map(c => (
                        <button key={c} onClick={() => handleNewCategoryChange(c)} className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${newExerciseCategory === c ? 'bg-primary border-primary text-black' : 'bg-slate-50 dark:bg-background-dark border-black/5 text-slate-400'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Músculo Principal</label>
                    <div className="flex flex-wrap gap-2.5">
                      {CATEGORY_MUSCLE_MAP[newExerciseCategory].map(m => (
                        <button key={m} onClick={() => setNewExerciseMuscle(m)} className={`px-5 py-3 rounded-2xl text-[10px] font-black transition-all border-2 ${newExerciseMuscle === m ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg' : 'bg-slate-50 dark:bg-background-dark border-black/5 text-slate-400'}`}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={createAndAddExercise} className="w-full py-7 rounded-[2.5rem] bg-black dark:bg-white text-white dark:text-black font-black text-lg shadow-xl transition-all active:scale-95 mt-4">CREAR Y AÑADIR</button>
                </div>
              ) : (
                <>
                  {searchTerm.length > 0 && filteredLibrary.length === 0 && (
                    <button onClick={() => setIsCreatingNew(true)} className="w-full flex items-center gap-5 p-6 rounded-[2.5rem] bg-primary/10 border-4 border-dashed border-primary/40 text-left active:scale-[0.98] transition-all">
                      <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-black shrink-0"><span className="material-symbols-outlined text-3xl font-black">add</span></div>
                      <div className="flex-1"><p className="font-black text-lg tracking-tight leading-none">Crear "{searchTerm}"</p></div>
                    </button>
                  )}
                  {filteredLibrary.map((ex) => (
                    <div key={ex.id} className="w-full flex items-center gap-5 p-4 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-black/5 shadow-sm transition-all active:scale-[0.98]" onClick={() => handleAddFromLibrary(ex)}>
                      <div className="size-12 rounded-xl overflow-hidden shrink-0"><img src={ex.thumbnail || getMuscleDefaultImage(ex.muscleGroup)} className="w-full h-full object-cover" alt="" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-base leading-tight truncate">{ex.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{ex.muscleGroup}</p>
                      </div>
                      <button className={`size-10 rounded-xl font-black text-[11px] transition-all flex items-center justify-center active:scale-125 ${addedFeedback === ex.id ? 'bg-green-500 text-white' : 'bg-primary text-black'}`}>
                        <span className="material-symbols-outlined text-xl">{addedFeedback === ex.id ? 'done' : 'add'}</span>
                      </button>
                    </div>
                  ))}
                  <div className="h-20 w-full shrink-0"></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div onClick={() => setShowSaveConfirm(false)} className="absolute inset-0"></div>
          <div className="w-full max-w-xs bg-white dark:bg-surface-dark rounded-[3rem] p-8 shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95 relative">
            <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/20"><span className="material-symbols-outlined text-4xl font-black">save</span></div>
            <div>
              <h3 className="text-xl font-black mb-1">¿Guardar rutina?</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed px-2">¿Quieres añadir esta rutina a tu biblioteca?</p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <button onClick={handleSave} className="w-full py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-sm active:scale-95 transition-all uppercase tracking-wider">SÍ, GUARDAR</button>
              <button onClick={() => setShowSaveConfirm(false)} className="w-full py-4 rounded-full bg-slate-100 dark:bg-background-dark text-slate-400 font-black text-sm active:scale-95 transition-all uppercase tracking-wider">CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateWorkout;
