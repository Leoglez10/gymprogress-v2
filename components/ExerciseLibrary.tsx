
import React, { useState, useMemo, useEffect } from 'react';

interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
  category: 'Push' | 'Pull' | 'Legs' | 'Core';
  type: string;
  img: string;
}

interface ExerciseLibraryProps {
  onBack: () => void;
}

const DEFAULT_EXERCISES: ExerciseItem[] = [
  { id: '1', name: 'Press de Banca', muscleGroup: 'Pecho', category: 'Push', type: 'Compuesto', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjGrpXnJfDW2XuNvlru-rwzBl4PIVvFUY_SeW991GJbAqDMGNnk_PaBzLx5LvCma3CtKX8hNSHYJhLQD1y40B5ZCsDbRgTDe744QXvTwf7SIy5xKBBvx_vHNeN-vFu0qaAGBiaTSG09hIJ877lE_2tipUkgMdedTdCC40WX1iGcvJfhuhzxyIzLZz5R6TnSToYNXbJ8yuphng-BGdKtlU856sOWjxTUS6omaCn37RtrxWx_wVAmdltTlxd_aAvkJ-sAISr2UUrRIw' },
  { id: '2', name: 'Press Militar', muscleGroup: 'Hombros', category: 'Push', type: 'Fuerza', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALN9Y5kO0pI_00vL89f_Vz_U-C8uL6e5pW6N_W0pI_00vL89f_Vz_U-C8uL6e5pW6N_W0pI_00vL89f_Vz_U-C8uL6e5pW6N_W0pI_00vL89f_Vz_U-C8uL6e5pW6N_W0pI_00vL89f_Vz_U-C8uL6e5pW6N_W' },
  { id: '3', name: 'Aperturas Mancuernas', muscleGroup: 'Pecho', category: 'Push', type: 'Aislamiento', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrtH9NfqHaCOpsRoKzAGZJIRftuUqrlvcD4SHFKuVJ2PP7w7CpRe4TjufhBLyq1o-6B_hmDkWYcxhcYhkfqE4xKRafCKD13kW9bgVJ_GK0bX2_vijTlmBoNM6QOxATE83Gx7e5pLMBkQxBi7xfQOncjDui_z2BG_NsvVn_4iG3kKnqly_0bjyQyxmM-_wDn3gJ4Le2kffKl2U3fw_usE4fPUcMVrAeOEk8Y0mHGwbCGzUse0MAT7pzxnjz6idnlKMFHiBquyUJpaw' },
  { id: '4', name: 'Fondos en Paralelas', muscleGroup: 'Tríceps', category: 'Push', type: 'Peso Corporal', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5NDLisU4ZJUtLGhfZsHosC9A7zEvLV0CKRNb_qeT3-AHq9zEb7nmbn6hpIVFrEgIqjf1vblE1J62fbR4A8AokqMOwWzUnqrB4Q58iZwOLi4f6XWjJOKn1xKRgX-OKk-VIPInuACjkEKv1uCKOGvJT2o3nD1yPMa-DiqfyPzY3tgeMWYxl89nXDKrA9Dfb98-hc0bp_-dghJIZDvimmQApS16LmsJd0L6RGzztrFT-I4-JW5cCZPlAva3VtyWtle7S6oWtk0EDFe4' },
  { id: '6', name: 'Peso Muerto', muscleGroup: 'Espalda', category: 'Pull', type: 'Compuesto', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbtzIdrGAvVOvv15lMawCZ2j8moQmz4vCFKn4413rNcBSPyuqZ9saPnMWJD5BT8HrXR_9xSo7ePhzZf2niZyOBo2OygYqIV2Oky4yKLA5B_JkSVV5QokZy261dx__BByIjX-7P2S70JsMhy5UBw2Sc685wjYbhDzQuEB1Qz4XqCVonIkS5dvKhQFTnUex8YJUhgqJrOaHA1sUMLPrqYZfwhMj_EkTlCySqpSZxSFJRsilW-WJChHnfDaM7HWLv4dR28OmmjstNl4c' },
  { id: '11', name: 'Sentadilla con Barra', muscleGroup: 'Piernas', category: 'Legs', type: 'Compuesto', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0zHBIvkuzqcBl3Y52YLbvk0acqtaV5yQsNWHPcc8J9Sr2u3wCPSxnHwmI7XD8UuS6n-VrgWewfFXrj8dUNHtv0GOLZJQKWeeHIG0Gl_smann4ZItZIQDMSXOUMROCWh6lFZzDDHTe9rOqEQb6pRMdHnWDtVEVfWw3QPglomK6PVNMq_R8OCNepkMYTF2ltrtCvpNcrBlU3H_IzXPyWT4ZfXB81-cSIBYlbYY1fNnDWTdZuJ2GamiKToxr56TFsZ9kwfznjUzhkDw' },
];

const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ onBack }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todo');
  const [activeMuscle, setActiveMuscle] = useState<string>('Todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<ExerciseItem | null>(null);
  const [exerciseList, setExerciseList] = useState<ExerciseItem[]>([]);

  // Cargar ejercicios de localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem('gymProgress_exercises');
    if (saved) {
      setExerciseList(JSON.parse(saved));
    } else {
      setExerciseList(DEFAULT_EXERCISES);
      localStorage.setItem('gymProgress_exercises', JSON.stringify(DEFAULT_EXERCISES));
    }
  }, []);

  // Guardar en localStorage cada vez que cambie la lista
  useEffect(() => {
    if (exerciseList.length > 0) {
      localStorage.setItem('gymProgress_exercises', JSON.stringify(exerciseList));
    }
  }, [exerciseList]);

  const [newExercise, setNewExercise] = useState<Omit<ExerciseItem, 'id' | 'img'>>({
    name: '',
    muscleGroup: '',
    category: 'Push',
    type: 'Personalizado'
  });

  const categories = ['Todo', 'Push', 'Pull', 'Legs', 'Core'];
  
  const muscles = useMemo(() => {
    const list = exerciseList
      .filter(e => activeCategory === 'Todo' || e.category === activeCategory)
      .map(e => e.muscleGroup);
    return ['Todos', ...Array.from(new Set(list))];
  }, [activeCategory, exerciseList]);

  const filteredExercises = useMemo(() => {
    return exerciseList.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'Todo' || ex.category === activeCategory;
      const matchesMuscle = activeMuscle === 'Todos' || ex.muscleGroup === activeMuscle;
      return matchesSearch && matchesCategory && matchesMuscle;
    });
  }, [search, activeCategory, activeMuscle, exerciseList]);

  const handleSaveNewExercise = () => {
    if (!newExercise.name || !newExercise.muscleGroup) return;
    const exerciseToAdd: ExerciseItem = {
      ...newExercise,
      id: Date.now().toString(),
      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALN9Y5kO0pI_00vL89f_Vz_U-C8uL6e5pW6N_W0pI_00vL89f_Vz_U-C8uL6e5pW6N_W0pI_00vL89f_Vz_U-C8uL6e5pW6N_W0pI_00vL89f_Vz_U-C8uL6e5pW6N_W'
    };
    setExerciseList(prev => [exerciseToAdd, ...prev]);
    setShowCreateModal(false);
    setNewExercise({ name: '', muscleGroup: '', category: 'Push', type: 'Personalizado' });
  };

  const handleConfirmDelete = () => {
    if (exerciseToDelete) {
      setExerciseList(prev => prev.filter(ex => ex.id !== exerciseToDelete.id));
      setExerciseToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background-light dark:bg-background-dark overflow-hidden relative">
      <div className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border-b border-black/5 dark:border-white/5 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center px-4 py-2 justify-between min-h-[56px]">
          <button onClick={onBack} aria-label="Volver" className="flex size-11 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-all">
            <span className="material-symbols-outlined text-[28px]">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold">Biblioteca</h2>
          <div className="size-11"></div>
        </div>
        
        <div className="px-4 py-3">
          <div className="flex w-full items-center rounded-2xl h-14 shadow-sm ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-surface-dark transition-all focus-within:ring-primary">
            <span className="material-symbols-outlined ml-4 text-slate-400">search</span>
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 text-base px-3 h-full font-medium" 
              placeholder="Buscar ejercicio..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2.5 px-4 pb-3 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setActiveMuscle('Todos'); }}
              className={`h-11 px-6 rounded-2xl text-xs font-bold uppercase tracking-wide transition-all shrink-0 active:scale-95 ${activeCategory === cat ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface-dark text-slate-400'}`}
            >
              {cat === 'Push' ? 'Empuje' : cat === 'Pull' ? 'Tracción' : cat === 'Legs' ? 'Piernas' : cat === 'Core' ? 'Core' : 'Todo'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar border-t border-black/5 dark:border-white/5 pt-3">
          {muscles.map(m => (
            <button
              key={m}
              onClick={() => setActiveMuscle(m)}
              className={`px-5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 ${activeMuscle === m ? 'bg-primary/20 text-primary-text' : 'bg-white/50 dark:bg-white/5 text-slate-400'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-40 space-y-3 no-scrollbar overscroll-behavior-contain">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Resultados ({filteredExercises.length})</h3>

        <div className="grid grid-cols-1 gap-3">
          {filteredExercises.length > 0 ? (
            filteredExercises.map(ex => (
              <div key={ex.id} className="flex items-center gap-4 p-3 bg-white dark:bg-surface-dark rounded-2xl border border-black/5 shadow-sm active:bg-slate-50 dark:active:bg-white/5 transition-all">
                <div 
                  className="size-16 rounded-xl bg-center bg-cover shrink-0 bg-slate-100 dark:bg-background-dark"
                  style={{ backgroundImage: `url("${ex.img}")` }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate leading-tight">{ex.name}</p>
                  <p className="text-[11px] font-bold text-primary-text uppercase tracking-wide mt-1">{ex.muscleGroup} • <span className="text-slate-400 font-medium">{ex.type}</span></p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[8px] font-bold px-2 py-1 rounded-md uppercase ${ex.category === 'Push' ? 'bg-blue-100 text-blue-600' : ex.category === 'Pull' ? 'bg-purple-100 text-purple-600' : ex.category === 'Legs' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                    {ex.category}
                  </span>
                  <button 
                    onClick={() => setExerciseToDelete(ex)}
                    aria-label="Eliminar ejercicio"
                    className="size-9 flex items-center justify-center rounded-full text-slate-300 active:text-red-500 active:bg-red-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-[22px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 animate-in fade-in duration-500">
              <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
              <p className="font-bold">No hay coincidencias</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-28 right-6 z-50">
        <button 
          onClick={() => setShowCreateModal(true)}
          aria-label="Nuevo ejercicio"
          className="size-16 flex items-center justify-center bg-primary text-black rounded-full shadow-2xl transition-all active:scale-90 active:rotate-90"
        >
          <span className="material-symbols-outlined text-[32px] font-bold">add</span>
        </button>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end animate-in fade-in duration-300">
          <div onClick={() => setShowCreateModal(false)} className="absolute inset-0"></div>
          <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[2.5rem] p-6 pb-12 shadow-2xl relative animate-in slide-in-from-bottom duration-500 overscroll-contain">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">Nuevo Ejercicio</h3>
              <button onClick={() => setShowCreateModal(false)} className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-background-dark active:scale-90 transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Nombre</label>
                <input 
                  type="text" 
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                  className="w-full bg-background-light dark:bg-background-dark border-0 ring-1 ring-black/5 rounded-2xl py-4 px-5 font-bold text-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {['Push', 'Pull', 'Legs', 'Core'].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setNewExercise({...newExercise, category: cat as any})}
                      className={`px-6 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${newExercise.category === cat ? 'bg-primary text-black border-none shadow-md' : 'bg-slate-100 dark:bg-background-dark text-slate-400'}`}
                    >
                      {cat === 'Push' ? 'Empuje' : cat === 'Pull' ? 'Tracción' : cat === 'Legs' ? 'Piernas' : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Músculo Principal</label>
                <input 
                  type="text" 
                  value={newExercise.muscleGroup}
                  onChange={(e) => setNewExercise({...newExercise, muscleGroup: e.target.value})}
                  className="w-full bg-background-light dark:bg-background-dark border-0 ring-1 ring-black/5 rounded-2xl py-4 px-5 font-bold text-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <button 
                onClick={handleSaveNewExercise}
                disabled={!newExercise.name || !newExercise.muscleGroup}
                className="w-full h-16 bg-primary text-black font-bold rounded-full shadow-lg active:scale-95 disabled:opacity-50 transition-all mt-4"
              >
                Crear Ejercicio
              </button>
            </div>
          </div>
        </div>
      )}

      {exerciseToDelete && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white dark:bg-surface-dark rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-300">
            <div className="size-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">¿Eliminar?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">¿Seguro que quieres borrar <span className="font-bold text-slate-900 dark:text-white">"{exerciseToDelete.name}"</span>?</p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <button onClick={handleConfirmDelete} className="w-full py-4 rounded-full bg-red-500 text-white font-bold text-sm active:scale-95 transition-all">Sí, eliminar</button>
              <button onClick={() => setExerciseToDelete(null)} className="w-full py-3 rounded-full bg-slate-100 dark:bg-background-dark text-slate-500 font-bold text-sm active:scale-95 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;
