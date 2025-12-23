
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { Exercise, UserProfile } from '../types';

interface StatsProps {
  onBack: () => void;
  userProfile: UserProfile;
}

const Stats: React.FC<StatsProps> = ({ onBack, userProfile }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('gymProgress_workout_history');
    const savedLibrary = localStorage.getItem('gymProgress_exercises');
    
    if (savedLibrary) setExerciseLibrary(JSON.parse(savedLibrary));

    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed);
      
      if (parsed.length > 0) {
        for (const session of parsed) {
          if (session.exercises && session.exercises.length > 0) {
            setSelectedExerciseId(String(session.exercises[0].exerciseId));
            break;
          }
        }
      }
    }
  }, []);

  const availableExercises = useMemo(() => {
    const map = new Map();
    history.forEach(session => {
      if (session.exercises) {
        session.exercises.forEach((ex: any) => {
          const idStr = String(ex.exerciseId);
          if (!map.has(idStr)) {
            map.set(idStr, { id: idStr, name: ex.name });
          }
        });
      }
    });
    return Array.from(map.values());
  }, [history]);

  const prProgression = useMemo(() => {
    if (!selectedExerciseId) return [];
    const progression: { date: string, weight: number, timestamp: number }[] = [];
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedHistory.forEach(session => {
      if (session.exercises) {
        const exerciseSession = session.exercises.find((ex: any) => String(ex.exerciseId) === selectedExerciseId);
        if (exerciseSession && exerciseSession.sets) {
          const maxWeight = Math.max(...exerciseSession.sets.map((s: any) => s.weight || 0));
          if (maxWeight > 0) {
            progression.push({
              date: new Date(session.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
              weight: maxWeight,
              timestamp: new Date(session.date).getTime()
            });
          }
        }
      }
    });
    return progression;
  }, [history, selectedExerciseId]);

  const selectedExerciseName = useMemo(() => {
    return availableExercises.find(ex => ex.id === selectedExerciseId)?.name || "Selecciona un ejercicio";
  }, [availableExercises, selectedExerciseId]);

  const statsSummary = useMemo(() => {
    if (prProgression.length === 0) return null;
    const start = prProgression[0].weight;
    const current = prProgression[prProgression.length - 1].weight;
    const diff = current - start;
    const percent = start > 0 ? ((diff / start) * 100).toFixed(1) : "0";
    return { start, current, diff, percent };
  }, [prProgression]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adjustedFirstDay = (firstDay + 6) % 7; 
    
    const days = [];
    for (let i = 0; i < adjustedFirstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentMonth]);

  const getWorkoutsForDate = (date: Date) => {
    return history.filter(h => new Date(h.date).toDateString() === date.toDateString());
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
    setSelectedDay(null);
  };

  const volumeData = useMemo(() => {
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleDateString('es-ES', { month: 'short' });
      const vol = history
        .filter(h => new Date(h.date).getMonth() === d.getMonth() && new Date(h.date).getFullYear() === d.getFullYear())
        .reduce((acc, curr) => acc + (Number(curr.volume) || 0), 0);
      last6Months.push({ month: label.charAt(0).toUpperCase() + label.slice(1), volume: vol || 100 });
    }
    return last6Months;
  }, [history]);

  const muscleData = useMemo(() => {
    const muscleTotals: Record<string, number> = {};
    let totalAllVolume = 0;

    const libraryMap: Record<string, string> = {};
    exerciseLibrary.forEach(ex => { libraryMap[String(ex.id)] = ex.muscleGroup; });

    history.forEach(session => {
      session.exercises?.forEach((ex: any) => {
        const muscle = ex.muscleGroup || libraryMap[String(ex.exerciseId)] || 'Otros';
        const vol = (ex.sets || []).reduce((acc: number, s: any) => acc + (Number(s.weight) * Number(s.reps) || 0), 0);
        
        if (vol > 0) {
          muscleTotals[muscle] = (muscleTotals[muscle] || 0) + vol;
          totalAllVolume += vol;
        }
      });
    });

    if (totalAllVolume === 0) {
      return [{ name: 'Sin Datos', value: 100, color: '#f1f5f9' }];
    }

    const colors = ['#FFEF0A', '#E6D709', '#CCBF08', '#B3A707', '#998F06', '#807705'];
    return Object.entries(muscleTotals)
      .map(([name, value], index) => ({
        name,
        value: Math.round((value / totalAllVolume) * 100),
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [history, exerciseLibrary]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32 animate-in fade-in duration-500">
      <header 
        className="flex items-center justify-between px-4 sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5"
        style={{ 
          paddingTop: 'calc(max(1rem, env(safe-area-inset-top)) + 0.5rem)',
          paddingBottom: '0.75rem'
        }}
      >
        <button onClick={onBack} className="flex size-11 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-all">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-black tracking-tight flex-1 text-center">Análisis Pro</h2>
        <div className="size-11"></div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-10 overflow-y-auto no-scrollbar">
        
        {/* SECCIÓN CALENDARIO */}
        <section className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-7 shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black tracking-tighter">Historial Diario</h3>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-background-dark/50 p-1.5 rounded-2xl">
              <button onClick={() => changeMonth(-1)} className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-surface-dark shadow-sm active:scale-90 transition-all"><span className="material-symbols-outlined text-xl">chevron_left</span></button>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 min-w-[100px] text-center">
                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => changeMonth(1)} className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-surface-dark shadow-sm active:scale-90 transition-all"><span className="material-symbols-outlined text-xl">chevron_right</span></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
              <div key={d} className="text-center text-[9px] font-black text-slate-300 uppercase py-2">{d}</div>
            ))}
            {calendarDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="aspect-square"></div>;
              const workouts = getWorkoutsForDate(date);
              const hasWorkouts = workouts.length > 0;
              const isSelected = selectedDay?.toDateString() === date.toDateString();
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <button 
                  key={i}
                  onClick={() => hasWorkouts ? setSelectedDay(date) : setSelectedDay(null)}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center text-xs font-black transition-all active:scale-90 ${
                    hasWorkouts 
                      ? isSelected ? 'bg-primary text-black scale-110 shadow-lg z-10' : 'bg-primary/20 text-primary-text'
                      : 'text-slate-400'
                  } ${isToday && !hasWorkouts ? 'border-2 border-primary/30' : ''}`}
                >
                  {date.getDate()}
                  {hasWorkouts && !isSelected && <div className="absolute bottom-1.5 size-1 bg-primary rounded-full"></div>}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mt-6 p-5 bg-slate-50 dark:bg-background-dark/50 rounded-3xl border border-black/5 animate-in slide-in-from-top-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Entrenamientos del {selectedDay.toLocaleDateString()}</p>
              <div className="space-y-3">
                {getWorkoutsForDate(selectedDay).map((w, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-black"><span className="material-symbols-outlined text-xl">fitness_center</span></div>
                      <div>
                        <p className="text-sm font-black">{w.name || 'Sesión de Entrenamiento'}</p>
                        <p className="text-[10px] font-bold text-slate-400">{w.duration} • {w.volume.toLocaleString()} {userProfile.weightUnit}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SECCIÓN DE PR PROGRESSION */}
        <section className="space-y-6">
          <div className="px-1 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Evolución de Cargas</p>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Récords Personales</h3>
            </div>
            <span className="material-symbols-outlined text-primary text-3xl fill-1">trending_up</span>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2">
            {availableExercises.length > 0 ? (
              availableExercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExerciseId(ex.id)}
                  className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${selectedExerciseId === ex.id ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface-dark text-slate-400 border border-black/5'}`}
                >
                  {ex.name}
                </button>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic px-2">Completa tu primer entrenamiento para ver progresos.</p>
            )}
          </div>

          <div className="bg-white dark:bg-surface-dark p-7 rounded-[2.5rem] shadow-sm border border-black/5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-lg font-black tracking-tight leading-tight">{selectedExerciseName}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Historial de peso máximo ({userProfile.weightUnit})</p>
              </div>
              {statsSummary && (
                <div className="text-right">
                  <p className="text-2xl font-black text-primary-text tracking-tighter">+{statsSummary.percent}%</p>
                  <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Mejora total</p>
                </div>
              )}
            </div>

            {prProgression.length > 1 ? (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prProgression}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFEF0A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FFEF0A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                    />
                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip 
                      cursor={{ stroke: '#FFEF0A', strokeWidth: 2 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black text-white px-4 py-2 rounded-2xl text-[12px] font-black shadow-2xl border border-white/10">
                              {payload[0].value} {userProfile.weightUnit}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#FFEF0A" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorWeight)"
                      dot={{ r: 6, fill: '#FFEF0A', strokeWidth: 3, stroke: '#fff' }}
                      activeDot={{ r: 8, fill: '#000', strokeWidth: 4, stroke: '#FFEF0A' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
                <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-800 mb-2">analytics</span>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[200px]">Se necesitan al menos 2 sesiones con este ejercicio para ver la tendencia.</p>
              </div>
            )}

            {statsSummary && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-background-dark/50 p-4 rounded-2xl border border-black/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Peso Inicial</p>
                  <p className="text-xl font-black">{statsSummary.start} {userProfile.weightUnit}</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-[9px] font-black text-primary-text uppercase tracking-widest mb-1">Ganancia Neta</p>
                  <p className="text-xl font-black text-primary-text">+{statsSummary.diff} {userProfile.weightUnit}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* VOLUMEN MENSUAL DINÁMICO */}
        <div className="bg-white dark:bg-surface-dark p-7 rounded-[2.5rem] shadow-sm border border-black/5">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Volumen Mensual ({userProfile.weightUnit})</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                />
                <Bar dataKey="volume" radius={[10, 10, 10, 10]} barSize={24}>
                  {volumeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === volumeData.length - 1 ? '#FFEF0A' : '#f1f5f9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DISTRIBUCIÓN MUSCULAR REAL */}
        <div className="bg-white dark:bg-surface-dark p-7 rounded-[2.5rem] shadow-sm border border-black/5">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Distribución Muscular</h3>
          <div className="flex items-center gap-6">
            <div className="h-40 w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={muscleData}
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {muscleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {muscleData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase">{item.name}</span>
                  </div>
                  <span className="text-xs font-black">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Stats;
