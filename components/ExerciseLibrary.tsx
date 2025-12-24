
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Exercise } from '../types';

interface ExerciseLibraryProps {
  onBack: () => void;
  onToggleFooter?: (visible: boolean) => void;
  isFooterVisible?: boolean;
}

const DEFAULT_EXERCISES: Exercise[] = [
  { id: '1', name: 'Press de Banca', muscleGroup: 'Pecho', category: 'Push', type: 'Compuesto', difficulty: 'Intermedio', equipment: 'Barra', thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop', lastWeight: 80 },
  { id: '2', name: 'Press Militar', muscleGroup: 'Hombros', category: 'Push', type: 'Fuerza', difficulty: 'Intermedio', equipment: 'Barra', thumbnail: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop', lastWeight: 50 },
  { id: '3', name: 'Aperturas Mancuernas', muscleGroup: 'Pecho', category: 'Push', type: 'Aislamiento', difficulty: 'Principiante', equipment: 'Mancuernas', thumbnail: 'https://images.unsplash.com/photo-1620188467120-5042ed1eb5da?q=80&w=400&auto=format&fit=crop', lastWeight: 14 },
  { id: '4', name: 'Fondos en Paralelas', muscleGroup: 'Tríceps', category: 'Push', type: 'Peso Corporal', difficulty: 'Avanzado', equipment: 'Peso Corporal', thumbnail: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=400&auto=format&fit=crop' },
  { id: '6', name: 'Peso Muerto', muscleGroup: 'Espalda', category: 'Pull', type: 'Compuesto', difficulty: 'Avanzado', equipment: 'Barra', thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400&auto=format&fit=crop', lastWeight: 140 },
  { id: '11', name: 'Sentadilla con Barra', muscleGroup: 'Piernas', category: 'Legs', type: 'Compuesto', difficulty: 'Intermedio', equipment: 'Barra', thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop', lastWeight: 100 },
];

const CATEGORY_MUSCLE_MAP: Record<string, string[]> = {
  'Push': ['Pecho', 'Hombros', 'Brazos'],
  'Pull': ['Espalda', 'Brazos'],
  'Legs': ['Piernas'],
  'Core': ['Core']
};

export const getMuscleDefaultImage = (muscleGroup: string) => {
  const muscle = muscleGroup.toLowerCase();
  if (muscle.includes('pecho')) return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop';
  if (muscle.includes('espalda')) return 'https://images.unsplash.com/photo-1603287611837-e21f37a4c70e?q=80&w=400&auto=format&fit=crop';
  if (muscle.includes('pierna') || muscle.includes('glúteo')) return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop';
  if (muscle.includes('hombro')) return 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400&auto=format&fit=crop';
  if (muscle.includes('brazo') || muscle.includes('bícep') || muscle.includes('trícep')) return 'https://images.unsplash.com/photo-1581009146145-b5ef03a7471b?q=80&w=400&auto=format&fit=crop';
  if (muscle.includes('core') || muscle.includes('abdom')) return 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop';
  return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop';
};

const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ onBack, onToggleFooter, isFooterVisible = true }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todo');
  const [activeMuscle, setActiveMuscle] = useState<string>('Todos');
  const [activeEquipment, setActiveEquipment] = useState<string>('Todos');
  const [exerciseList, setExerciseList] = useState<Exercise[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showPatternHelp, setShowPatternHelp] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  
  const mainRef = useRef<HTMLElement>(null);
  const lastScrollTop = useRef(0);
  
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingEx, setEditingEx] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    muscle: 'Pecho',
    equipment: 'Mancuernas' as any,
    difficulty: 'Intermedio' as any,
    category: 'Push' as any
  });

  useEffect(() => {
    const history = localStorage.getItem('gymProgress_workout_history');
    if (history) setWorkoutHistory(JSON.parse(history));

    const saved = localStorage.getItem('gymProgress_exercises');
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = [...parsed];
      DEFAULT_EXERCISES.forEach(def => {
        if (!merged.find(m => String(m.id) === String(def.id))) merged.push(def);
      });
      setExerciseList(merged);
    } else {
      setExerciseList(DEFAULT_EXERCISES);
      localStorage.setItem('gymProgress_exercises', JSON.stringify(DEFAULT_EXERCISES));
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (showFilters && scrollTop > 30) setShowFilters(false);
    if (scrollTop > 20) setIsScrolled(true);
    else setIsScrolled(false);
    if (Math.abs(scrollTop - lastScrollTop.current) > 10) {
      if (scrollTop > lastScrollTop.current && scrollTop > 60) onToggleFooter?.(false);
      else if (scrollTop < lastScrollTop.current) onToggleFooter?.(true);
      lastScrollTop.current = scrollTop;
    }
  };

  const saveList = (list: Exercise[]) => {
    setExerciseList(list);
    localStorage.setItem('gymProgress_exercises', JSON.stringify(list));
  };

  const handleOpenCreate = () => {
    setFormData({ name: '', muscle: 'Pecho', equipment: 'Mancuernas', difficulty: 'Intermedio', category: 'Push' });
    setShowPatternHelp(false);
    setModalMode('create');
  };

  const handleOpenEdit = (ex: Exercise) => {
    setEditingEx(ex);
    setFormData({
      name: ex.name,
      muscle: ex.muscleGroup,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      category: ex.category
    });
    setShowPatternHelp(false);
    setModalMode('edit');
  };

  const handleCategoryChange = (newCat: any) => {
    const validMuscles = CATEGORY_MUSCLE_MAP[newCat];
    const isCurrentMuscleValid = validMuscles.includes(formData.muscle);
    setFormData({
      ...formData,
      category: newCat,
      muscle: isCurrentMuscleValid ? formData.muscle : validMuscles[0]
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    if (modalMode === 'create') {
      const exercise: Exercise = {
        id: `custom_${Date.now()}`,
        name: formData.name,
        muscleGroup: formData.muscle,
        category: formData.category,
        difficulty: formData.difficulty,
        equipment: formData.equipment,
        type: 'Personalizado',
        thumbnail: getMuscleDefaultImage(formData.muscle)
      };
      saveList([exercise, ...exerciseList]);
    } else if (modalMode === 'edit' && editingEx) {
      const updated = exerciseList.map(ex => 
        String(ex.id) === String(editingEx.id) 
          ? { 
              ...ex, 
              name: formData.name, 
              muscleGroup: formData.muscle, 
              equipment: formData.equipment, 
              difficulty: formData.difficulty, 
              category: formData.category,
              thumbnail: ex.thumbnail || getMuscleDefaultImage(formData.muscle)
            } 
          : ex
      );
      saveList(updated);
    }
    setModalMode(null);
    setEditingEx(null);
  };

  const confirmDelete = () => {
    if (!exerciseToDelete) return;
    const updated = exerciseList.filter(ex => String(ex.id) !== String(exerciseToDelete.id));
    saveList(updated);
    setExerciseToDelete(null);
  };

  const toggleFavorite = (id: string) => {
    const updated = exerciseList.map(ex => 
      String(ex.id) === String(id) ? { ...ex, isFavorite: !ex.isFavorite } : ex
    );
    saveList(updated);
  };

  const progressionMap = useMemo(() => {
    const map: Record<string, { weight: number, date: string }[]> = {};
    const sortedHistory = [...workoutHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sortedHistory.forEach(session => {
      if (session.exercises && Array.isArray(session.exercises)) {
        session.exercises.forEach((ex: any) => {
          if (!ex.sets || !Array.isArray(ex.sets)) return;
          const completedWeights = ex.sets.filter((s: any) => s.completed || s.weight > 0).map((s: any) => Number(s.weight) || 0);
          if (completedWeights.length > 0) {
            const maxWeight = Math.max(...completedWeights);
            if (maxWeight > 0) {
              const exIdStr = String(ex.exerciseId);
              if (!map[exIdStr]) map[exIdStr] = [];
              map[exIdStr].push({ weight: maxWeight, date: new Date(session.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) });
            }
          }
        });
      }
    });
    return map;
  }, [workoutHistory]);

  const filteredExercises = useMemo(() => {
    return exerciseList.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || ex.muscleGroup.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'Todo' || ex.category === activeCategory;
      const matchesMuscle = activeMuscle === 'Todos' || ex.muscleGroup === activeMuscle;
      const matchesEquipment = activeEquipment === 'Todos' || ex.equipment === activeEquipment;
      return matchesSearch && matchesCategory && matchesMuscle && matchesEquipment;
    }).sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
  }, [search, activeCategory, activeMuscle, activeEquipment, exerciseList]);

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark animate-in fade-in duration-500 overflow-hidden">
      <header className={`sticky top-0 z-[60] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isScrolled ? 'bg-white/95 dark:bg-background-dark/95 backdrop-blur-2xl shadow-xl' : 'bg-white/80 dark:bg-background-dark/90 backdrop-blur-xl'} border-b border-black/5 dark:border-white/5`} style={{ paddingTop: 'calc(max(0.75rem, env(safe-area-inset-top)) + 0.5rem)', paddingBottom: isScrolled ? '0.75rem' : '1.25rem' }}>
        <div className={`flex items-center px-6 justify-between transition-all duration-500 overflow-hidden ${isScrolled ? 'max-h-0 opacity-0 mb-0 scale-90 pointer-events-none' : 'max-h-20 opacity-100 mb-6 scale-100'}`}>
          <button onClick={onBack} className="size-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-500 active:scale-90 transition-all border border-black/5"><span className="material-symbols-outlined text-2xl font-black">arrow_back</span></button>
          <div className="text-center">
            <h2 className="text-xl font-black tracking-tighter leading-none">Mi Atlas</h2>
            <p className="text-[9px] font-black uppercase text-slate-900 dark:text-white tracking-[0.2em] mt-1">Biblioteca Global</p>
          </div>
          <button onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')} className="size-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-500 active:scale-90 transition-all border border-black/5"><span className="material-symbols-outlined text-2xl font-black">{viewMode === 'grid' ? 'grid_view' : 'view_list'}</span></button>
        </div>
        <div className="px-6 space-y-4">
          <div className="flex items-center gap-3">
            {(isScrolled && !showFilters) && (<button onClick={onBack} className="size-11 shrink-0 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-500 active:scale-90 transition-all border border-black/5 animate-in slide-in-from-left-4 duration-300"><span className="material-symbols-outlined text-xl font-black">arrow_back</span></button>)}
            <div className="relative group flex-1 transition-all duration-300"><div className="absolute inset-0 bg-primary/10 rounded-[1.5rem] blur-md opacity-0 group-focus-within:opacity-100 transition-opacity"></div><div className={`relative flex items-center bg-slate-50 dark:bg-surface-dark rounded-[1.5rem] px-5 border border-black/5 dark:border-white/5 shadow-inner transition-all focus-within:ring-2 focus-within:ring-primary ${isScrolled ? 'h-11' : 'h-14'}`}><span className="material-symbols-outlined text-slate-400 mr-3 text-xl">search</span><input className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-slate-400 placeholder:font-medium" placeholder="Busca ejercicios o músculos..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
            <button onClick={() => setShowFilters(!showFilters)} className={`rounded-[1.5rem] flex items-center justify-center transition-all active:scale-90 border relative shrink-0 ${isScrolled ? 'size-11' : 'size-14'} ${showFilters || (activeCategory !== 'Todo' || activeMuscle !== 'Todos' || activeEquipment !== 'Todos') ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'bg-white dark:bg-surface-dark text-slate-400 border-black/5'}`}><span className={`material-symbols-outlined font-black transition-all ${isScrolled ? 'text-xl' : 'text-2xl'}`}>{showFilters ? 'close' : 'tune'}</span>{(activeCategory !== 'Todo' || activeMuscle !== 'Todos' || activeEquipment !== 'Todos') && !showFilters && (<div className="absolute -top-0.5 -right-0.5 size-3 bg-primary rounded-full border-2 border-white dark:border-background-dark"></div>)}</button>
          </div>
          <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${showFilters ? 'max-h-[600px] opacity-100 mt-4 mb-2' : 'max-h-0 opacity-0'}`}><div className="bg-slate-100 dark:bg-surface-dark/80 p-6 rounded-[2.5rem] border border-black/5 space-y-6"><div className="flex items-center justify-between mb-2"><h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Configuración de Búsqueda</h4><button onClick={() => { setActiveCategory('Todo'); setActiveMuscle('Todos'); setActiveEquipment('Todos'); }} className="text-[9px] font-black uppercase text-primary tracking-widest bg-black dark:bg-white/10 px-3 py-1 rounded-full active:scale-95 transition-all">Limpiar</button></div><div className="space-y-4"><div className="space-y-2"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Movimiento</p><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{['Todo', 'Push', 'Pull', 'Legs', 'Core'].map(cat => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border-2 active:scale-95 ${activeCategory === cat ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface-dark border-black/5 text-slate-400'}`}>{cat}</button>))}</div></div><div className="space-y-2"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Músculo Objetivo</p><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core'].map(m => (<button key={m} onClick={() => setActiveMuscle(m)} className={`px-4 h-9 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shrink-0 border active:scale-95 ${activeMuscle === m ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md' : 'bg-white dark:bg-surface-dark border-black/5 text-slate-400'}`}>{m}</button>))}</div></div><div className="space-y-2"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Equipamiento</p><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{['Todos', 'Barra', 'Mancuernas', 'Polea', 'Máquina', 'Peso Corporal'].map(e => (<button key={e} onClick={() => setActiveEquipment(e)} className={`px-4 h-9 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shrink-0 border active:scale-95 ${activeEquipment === e ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md' : 'bg-white dark:bg-surface-dark border-black/5 text-slate-400'}`}>{e}</button>))}</div></div></div></div></div>
        </div>
      </header>

      <main ref={mainRef} onScroll={handleScroll} className="flex-1 px-4 pt-6 pb-48 overflow-y-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-2 mb-6 px-4">
          <span className={`size-2 rounded-full bg-primary transition-all duration-300 ${isScrolled ? 'scale-150' : 'animate-pulse'}`}></span>
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.25em]">{filteredExercises.length} Ejercicios encontrados</h3>
        </div>
        <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4 pb-20" : "flex flex-col gap-4 pb-20"}>
          {filteredExercises.map(ex => (
            <ExerciseCard 
              key={ex.id} 
              ex={ex} 
              isGrid={viewMode === 'grid'} 
              onFavorite={() => toggleFavorite(ex.id)} 
              onDelete={() => setExerciseToDelete(ex)} 
              onEdit={() => handleOpenEdit(ex)} 
              isDeletable={!DEFAULT_EXERCISES.find(d => String(d.id) === String(ex.id))} 
              progression={progressionMap[String(ex.id)] || []} 
            />
          ))}
        </div>
      </main>

      <div className={`fixed right-6 z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isFooterVisible ? 'bottom-[calc(112px+env(safe-area-inset-bottom))] scale-100 opacity-100' : 'bottom-[calc(32px+env(safe-area-inset-bottom))] scale-95 opacity-90'}`}>
        <button onClick={handleOpenCreate} className="w-16 h-16 bg-primary text-black rounded-full shadow-[0_15px_35px_rgba(255,239,10,0.35)] flex items-center justify-center active:scale-90 transition-all border-4 border-white dark:border-background-dark relative z-10">
          <span className="material-symbols-outlined text-4xl font-black">add</span>
        </button>
      </div>

      {exerciseToDelete && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white dark:bg-surface-dark rounded-[3rem] p-8 shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95">
            <div className="size-20 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <div>
              <h3 className="text-xl font-black mb-1">¿Borrar ejercicio?</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Estás a punto de eliminar <span className="text-slate-900 dark:text-white font-bold">"{exerciseToDelete.name}"</span>. Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <button onClick={confirmDelete} className="w-full py-4 rounded-full bg-rose-500 text-white font-black text-sm active:scale-95 transition-all uppercase tracking-widest">ELIMINAR</button>
              <button onClick={() => setExerciseToDelete(null)} className="w-full py-4 rounded-full bg-slate-100 dark:bg-background-dark text-slate-400 font-black text-sm active:scale-95 transition-all uppercase tracking-widest">CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-end animate-in fade-in duration-300">
          <div onClick={() => setModalMode(null)} className="absolute inset-0"></div>
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 relative">
            <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-5 mb-2 opacity-50"></div>
            <div className="p-8 pb-4 flex items-center justify-between"><div><h3 className="text-3xl font-black tracking-tighter">{modalMode === 'create' ? 'Crear Ejercicio' : 'Personalizar'}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configura todos los parámetros</p></div><button onClick={() => setModalMode(null)} className="size-11 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all"><span className="material-symbols-outlined">close</span></button></div>
            <div className="flex-1 overflow-y-auto px-8 pb-40 space-y-10 no-scrollbar">
              <div className="space-y-4 pt-4"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nombre del Ejercicio</label><input type="text" placeholder="Ej: Press de Banca Inclinado..." className="w-full bg-slate-50 dark:bg-background-dark border-0 rounded-2xl py-5 px-6 font-bold text-xl focus:ring-4 focus:ring-primary/20" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} autoFocus={modalMode === 'create'} /></div>
              <div className="space-y-4">
                <div className="flex items-center gap-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Patrón de Movimiento</label><button onClick={() => setShowPatternHelp(!showPatternHelp)} className="size-5 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black border border-black/5 active:bg-primary active:text-black transition-all">?</button></div>
                {showPatternHelp && (<div className="bg-slate-50 dark:bg-background-dark/50 p-5 rounded-[2rem] border-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300"><p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed"><span className="text-primary-text dark:text-primary font-black">PUSH:</span> Empuje (Pecho, Hombros, Tríceps)<br/><span className="text-primary-text dark:text-primary font-black">PULL:</span> Tracción (Espalda, Bíceps)<br/><span className="text-primary-text dark:text-primary font-black">LEGS:</span> Tren inferior (Piernas y Glúteos)<br/><span className="text-primary-text dark:text-primary font-black">CORE:</span> Estabilidad lumbar</p></div>)}
                <div className="flex flex-wrap gap-2">{['Push', 'Pull', 'Legs', 'Core'].map(c => (<button key={c} onClick={() => handleCategoryChange(c)} className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${formData.category === c ? 'bg-primary border-primary text-black' : 'bg-slate-50 dark:bg-background-dark border-black/5 text-slate-400'}`}>{c}</button>))}</div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Músculo Principal</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_MUSCLE_MAP[formData.category].map(m => (
                    <button key={m} onClick={() => setFormData({...formData, muscle: m})} className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${formData.muscle === m ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md' : 'bg-slate-50 dark:bg-background-dark border-black/5 text-slate-400'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Equipamiento Necesario</label><div className="flex flex-wrap gap-2">{['Mancuernas', 'Barra', 'Polea', 'Máquina', 'Peso Corporal'].map(e => (<button key={e} onClick={() => setFormData({...formData, equipment: e as any})} className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${formData.equipment === e ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md' : 'bg-slate-50 dark:bg-background-dark border-black/5 text-slate-400'}`}>{e}</button>))}</div></div>
              <div className="space-y-4"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Dificultad de Ejecución</label><div className="flex flex-wrap gap-2">{['Principiante', 'Intermedio', 'Avanzado'].map(d => (<button key={d} onClick={() => setFormData({...formData, difficulty: d as any})} className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${formData.difficulty === d ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md' : 'bg-slate-50 dark:bg-background-dark border-black/5 text-slate-400'}`}>{d}</button>))}</div></div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white dark:from-surface-dark via-white dark:via-surface-dark to-transparent pt-12"><button onClick={handleSave} disabled={!formData.name.trim()} className="w-full py-7 rounded-[2.5rem] bg-primary text-black font-black text-xl shadow-2xl shadow-primary/30 active:scale-[0.97] transition-all disabled:opacity-30 uppercase tracking-widest">{modalMode === 'create' ? 'Añadir al Atlas' : 'Guardar Cambios'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExerciseCard: React.FC<{ ex: Exercise; isGrid: boolean; onFavorite: () => void; onDelete: () => void; onEdit: () => void; isDeletable: boolean; progression: { weight: number, date: string }[]; }> = ({ ex, isGrid, onFavorite, onDelete, onEdit, isDeletable, progression }) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isDeletingEffect, setIsDeletingEffect] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => { 
    if (isGrid) return; 
    startX.current = e.touches[0].clientX; 
    isDragging.current = true; 
  };

  const onTouchMove = (e: React.TouchEvent) => { 
    if (isGrid || !isDragging.current) return; 
    const currentX = e.touches[0].clientX; 
    const diff = currentX - startX.current; 
    
    if (diff < 0) { 
      setSwipeX(diff); 
      // Si desliza mucho, visualmente indicamos que se borrará
      if (diff < -220 && isDeletable) setIsDeletingEffect(true); 
      else setIsDeletingEffect(false); 
    } 
  };

  const onTouchEnd = () => { 
    if (isGrid) return; 
    isDragging.current = false; 
    
    // Si el deslizamiento fue total, disparamos la confirmación de borrado
    if (swipeX < -220 && isDeletable) {
      setSwipeX(0);
      setIsDeletingEffect(false);
      onDelete();
    } 
    // Si el deslizamiento fue parcial, dejamos el botón a la vista
    else if (swipeX < -100 && isDeletable) {
      setSwipeX(-100);
    } 
    // Si no, volvemos a la posición inicial
    else { 
      setSwipeX(0); 
      setIsDeletingEffect(false); 
    } 
  };

  const difficultyStyles = { 'Principiante': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', 'Intermedio': 'text-amber-500 bg-amber-500/10 border-amber-500/20', 'Avanzado': 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
  
  const improvementPercent = useMemo(() => { 
    if (progression.length < 2) return null; 
    const start = progression[0].weight; 
    const current = progression[progression.length - 1].weight; 
    if (start === 0) return null; 
    const diff = (((current - start) / start) * 100).toFixed(1); 
    return parseFloat(diff) > 0 ? `+${diff}` : diff; 
  }, [progression]);

  return (
    <div className={`relative overflow-hidden rounded-[2.5rem] transition-all duration-300 ${isDeletingEffect ? 'scale-95 opacity-50' : 'scale-100'}`}>
      {!isGrid && isDeletable && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute inset-0 bg-rose-500 flex items-center justify-end px-10 transition-opacity duration-300" 
          style={{ opacity: Math.abs(swipeX) > 40 ? 1 : 0 }}
        >
          <span className="material-symbols-outlined text-white text-3xl font-black">delete</span>
        </button>
      )}
      
      <div 
        onTouchStart={onTouchStart} 
        onTouchMove={onTouchMove} 
        onTouchEnd={onTouchEnd} 
        onClick={() => setIsExpanded(!isExpanded)} 
        className={`group bg-white dark:bg-surface-dark border border-black/5 dark:border-white/5 shadow-sm overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] relative flex flex-col ${isGrid ? '' : 'p-4'}`} 
        style={{ transform: `translateX(${swipeX}px)`, borderRadius: 'inherit' }}
      >
        <div className={`flex ${isGrid ? 'flex-col' : 'flex-row items-center gap-5'}`}>
          <div className={`relative shrink-0 overflow-hidden ${isGrid ? 'h-40 w-full' : 'size-28 rounded-3xl shadow-lg'}`}>
            <img src={ex.thumbnail || getMuscleDefaultImage(ex.muscleGroup)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={ex.name} />
            {isGrid && (
              <button onClick={(e) => { e.stopPropagation(); onFavorite(); }} className={`absolute top-3 right-3 size-10 rounded-2xl backdrop-blur-md flex items-center justify-center transition-all active:scale-125 ${ex.isFavorite ? 'bg-primary text-black' : 'bg-black/20 text-white'}`}>
                <span className={`material-symbols-outlined text-xl ${ex.isFavorite ? 'fill-1' : ''}`}>{ex.isFavorite ? 'star' : 'star_border'}</span>
              </button>
            )}
          </div>
          <div className={`flex-1 min-w-0 ${isGrid ? 'p-6' : 'pr-2'}`}>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${difficultyStyles[ex.difficulty as keyof typeof difficultyStyles]}`}>{ex.difficulty}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-black/5">{ex.equipment}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <h4 className={`font-black tracking-tighter leading-tight truncate text-slate-900 dark:text-white ${isGrid ? 'text-lg' : 'text-base'}`}>{ex.name}</h4>
              <span className={`material-symbols-outlined text-slate-300 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-primary' : ''}`}>expand_more</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ex.muscleGroup} • {ex.category}</p>
              <div className="flex gap-2">
                {!isGrid && (
                  <button onClick={(e) => { e.stopPropagation(); onFavorite(); }} className={`size-8 rounded-lg flex items-center justify-center transition-all ${ex.isFavorite ? 'bg-primary text-black' : 'bg-slate-50 dark:bg-white/5 text-slate-300'}`}>
                    <span className={`material-symbols-outlined text-[18px] ${ex.isFavorite ? 'fill-1' : ''}`}>{ex.isFavorite ? 'star' : 'star_border'}</span>
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="size-8 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 flex items-center justify-center active:bg-primary active:text-black transition-all">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isExpanded ? 'max-h-[350px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
          <div className="pt-6 border-t border-black/5 dark:border-white/5">
            {progression.length > 1 ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-end px-2">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Inicio</p>
                      <p className="text-xl font-black">{progression[0].weight} <span className="text-[10px] opacity-40">kg</span></p>
                    </div>
                    <div className="w-px h-8 bg-black/5 dark:bg-white/5 self-center"></div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Actual</p>
                      <p className="text-xl font-black">{progression[progression.length-1].weight} <span className="text-[10px] opacity-40">kg</span></p>
                    </div>
                  </div>
                  {improvementPercent && (
                    <div className="bg-primary/10 text-primary-text dark:text-primary px-3 py-1 rounded-full border border-primary/20">
                      <p className="text-[10px] font-black uppercase tracking-widest">{improvementPercent}% Mejora</p>
                    </div>
                  )}
                </div>
                <div className="h-44 w-full bg-slate-50/50 dark:bg-background-dark/30 rounded-[2rem] p-4 border border-black/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progression}>
                      <defs>
                        <linearGradient id={`colorProg-${ex.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFEF0A" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#FFEF0A" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                      <XAxis dataKey="date" hide={false} axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: '900', fill: '#94a3b8' }} padding={{ left: 10, right: 10 }} />
                      <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip cursor={{ stroke: '#FFEF0A', strokeWidth: 2 }} content={({ active, payload }) => { if (active && payload && payload.length) { return (<div className="bg-black text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-2xl border border-white/10">{payload[0].value} kg</div>); } return null; }} />
                      <Area type="monotone" dataKey="weight" stroke="#FFEF0A" strokeWidth={4} fillOpacity={1} fill={`url(#colorProg-${ex.id})`} dot={{ r: 4, fill: '#FFEF0A', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#000', strokeWidth: 3, stroke: '#FFEF0A' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem] mx-2">
                <span className="material-symbols-outlined text-3xl text-slate-200 dark:text-slate-800 mb-2">analytics</span>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed max-w-[180px]">Sin datos suficientes para mostrar progresión.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseLibrary;
