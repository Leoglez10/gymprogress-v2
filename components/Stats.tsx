
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { Exercise, UserProfile } from '../types';

interface StatsProps {
  onBack: () => void;
  userProfile: UserProfile;
  onAddWorkout?: (date?: Date) => void;
}

const Stats: React.FC<StatsProps> = ({ onBack, userProfile, onAddWorkout }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [showMuscleDetail, setShowMuscleDetail] = useState(false);

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

  const totalTrainedDays = useMemo(() => {
    const uniqueDates = new Set(history.map(h => new Date(h.date).toDateString()));
    return uniqueDates.size;
  }, [history]);

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
    const searchString = date.toDateString();
    return history.filter(h => new Date(h.date).toDateString() === searchString);
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
    setSelectedDay(null);
  };

  const volumeData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString('es-ES', { month: 'short' });
      const yearLabel = d.getFullYear();
      
      const vol = history
        .filter(h => {
          const workoutDate = new Date(h.date);
          return workoutDate.getMonth() === d.getMonth() && workoutDate.getFullYear() === d.getFullYear();
        })
        .reduce((acc, curr) => acc + (Number(curr.volume) || 0), 0);
      
      data.push({ 
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        fullMonth: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        year: yearLabel,
        volume: vol,
        isReal: vol > 0,
        isTargetMonth: i === 0 
      });
    }
    return data;
  }, [history, currentMonth]);

  const monthlyComparison = useMemo(() => {
    if (volumeData.length < 2) return null;
    const currentViewed = volumeData[volumeData.length - 1];
    const previousViewed = volumeData[volumeData.length - 2];
    const currentVal = currentViewed.volume;
    const previousVal = previousViewed.volume;
    const diff = currentVal - previousVal;
    const percent = previousVal > 0 ? Math.round((diff / previousVal) * 100) : 0;
    
    return { 
      currentLabel: currentViewed.month,
      currentYear: currentViewed.year,
      current: currentVal, 
      previous: previousVal, 
      diff, 
      percent, 
      isUp: diff >= 0 
    };
  }, [volumeData]);

  const muscleData = useMemo(() => {
    const muscleTotals: Record<string, number> = {};
    let totalAllVolume = 0;

    const libraryMap: Record<string, string> = {};
    exerciseLibrary.forEach(ex => { libraryMap[String(ex.id)] = ex.muscleGroup; });

    const historyCurrentMonth = history.filter(h => {
      const d = new Date(h.date);
      return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    });

    historyCurrentMonth.forEach(session => {
      session.exercises?.forEach((ex: any) => {
        const muscle = ex.muscleGroup || libraryMap[String(ex.exerciseId)] || 'Otros';
        const vol = (ex.sets || []).reduce((acc: number, s: any) => acc + (Number(s.weight) * Number(s.reps) || 0), 0);
        
        if (vol > 0) {
          muscleTotals[muscle] = (muscleTotals[muscle] || 0) + vol;
          totalAllVolume += vol;
        }
      });
    });

    if (totalAllVolume === 0) return [];

    const colors = ['#FFEF0A', '#60a5fa', '#34d399', '#f87171', '#c084fc'];
    return Object.entries(muscleTotals)
      .map(([name, value]) => ({
        name,
        value: Number(value),
        percent: Math.round((value / totalAllVolume) * 100),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, index) => ({ ...item, color: colors[index % colors.length] }));
  }, [history, exerciseLibrary, currentMonth]);

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32 animate-in fade-in duration-500">
      <header 
        className="flex items-center justify-between px-4 sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5"
        style={{ paddingTop: 'calc(max(1rem, env(safe-area-inset-top)) + 0.5rem)', paddingBottom: '0.75rem' }}
      >
        <button onClick={onBack} className="flex size-11 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10 transition-all">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-black tracking-tight flex-1 text-center">Análisis Histórico</h2>
        <div className="size-11"></div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-10 overflow-y-auto no-scrollbar">
        <section className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-7 shadow-sm border border-black/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black tracking-tighter">Calendario</h3>
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
              const today = new Date(); today.setHours(0,0,0,0);
              const isFuture = date > today;
              const workouts = getWorkoutsForDate(date);
              const hasWorkouts = workouts.length > 0;
              const isSelected = selectedDay?.toDateString() === date.toDateString();
              const isToday = new Date().toDateString() === date.toDateString();
              
              const showFlame = hasWorkouts && totalTrainedDays > 1;

              return (
                <button 
                  key={i} 
                  disabled={isFuture} 
                  onClick={() => !isFuture && setSelectedDay(date)} 
                  className={`relative aspect-square rounded-2xl flex items-center justify-center text-xs font-black transition-all ${isFuture ? 'opacity-20 pointer-events-none' : 'active:scale-90'} ${
                    isSelected 
                      ? 'bg-primary text-black scale-110 shadow-lg z-10' 
                      : showFlame
                        ? 'calendar-flame-bg text-white' 
                        : hasWorkouts 
                          ? 'bg-primary/20 text-primary-text' 
                          : 'text-slate-400'
                  } ${isToday && !isSelected ? 'border-2 border-primary/30' : ''}`}
                >
                  <span className="relative z-10">{date.getDate()}</span>
                  {showFlame && !isSelected && (
                    <span className="material-symbols-outlined absolute -bottom-1 text-[16px] text-orange-400 flame-icon-anim fill-1">local_fire_department</span>
                  )}
                  {hasWorkouts && !isSelected && !showFlame && <div className="absolute bottom-1.5 size-1 bg-primary rounded-full"></div>}
                </button>
              );
            })}
          </div>
          {selectedDay && (
            <div className="mt-6 p-5 bg-slate-50 dark:bg-background-dark/50 rounded-3xl border border-black/5 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                {selectedDay <= new Date() && (
                  <button onClick={() => onAddWorkout?.(selectedDay)} className="flex items-center gap-1.5 bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-full active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-[16px] font-black">add_circle</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Añadir</span>
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {getWorkoutsForDate(selectedDay).length > 0 ? (
                  getWorkoutsForDate(selectedDay).map((w, i) => (
                    <div key={i} className="flex items-center justify-between bg-white dark:bg-surface-dark p-4 rounded-2xl border border-black/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-sm"><span className="material-symbols-outlined text-xl">fitness_center</span></div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{w.name || 'Sesión Libre'}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{w.duration} • {w.volume.toLocaleString()} {userProfile.weightUnit}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center opacity-40">
                     <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                     <p className="text-[10px] font-black uppercase tracking-widest">Sin actividad este día</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-surface-dark p-7 rounded-[2.5rem] shadow-sm border border-black/5">
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-[0.2em]">Auditoría de Carga</h3>
                <h4 className="text-2xl font-black tracking-tighter">Progresión por Meses</h4>
              </div>
              <button 
                onClick={() => setShowMuscleDetail(true)}
                className="size-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl active:scale-90 transition-all"
              >
                <span className="material-symbols-outlined font-black">pie_chart</span>
              </button>
            </div>

            {monthlyComparison && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                 <div className="bg-black dark:bg-white/5 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">{monthlyComparison.currentLabel} {monthlyComparison.currentYear}</p>
                    <div className="flex items-baseline gap-1.5">
                       <span className="text-3xl font-black tabular-nums text-white dark:text-white leading-none">{monthlyComparison.current.toLocaleString()}</span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase">{userProfile.weightUnit}</span>
                    </div>
                 </div>
                 <div className="bg-slate-50 dark:bg-background-dark/50 p-5 rounded-3xl border border-black/5 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vs. Mes Anterior</p>
                       <div className={`flex items-center gap-0.5 font-black text-[10px] ${monthlyComparison.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                          <span className="material-symbols-outlined text-[14px] font-black">{monthlyComparison.isUp ? 'arrow_upward' : 'arrow_downward'}</span>
                          {Math.abs(monthlyComparison.percent)}%
                       </div>
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                       <span className="text-xl font-black tabular-nums text-slate-700 dark:text-slate-300">{monthlyComparison.previous.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
            )}
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={(props: any) => {
                  const { x, y, payload } = props;
                  const item = volumeData[payload.index];
                  const showYear = payload.index === 0 || item.month === 'Ene';
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={15} dy={0} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight="900">{payload.value}</text>
                      {showYear && <text x={0} y={30} dy={0} textAnchor="middle" fill="#cbd5e1" fontSize={8} fontWeight="700">{item.year}</text>}
                    </g>
                  );
                }} />
                <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => active && payload ? <div className="bg-black text-white px-4 py-2 rounded-2xl text-[12px] font-black shadow-2xl"><p className="text-[10px] text-slate-400 mb-1">{payload[0].payload.fullMonth}</p>{payload[0].value.toLocaleString()} {userProfile.weightUnit}</div> : null} />
                <Bar dataKey="volume" radius={[12, 12, 12, 12]} barSize={28}>
                  {volumeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.isTargetMonth ? '#FFEF0A' : '#f1f5f9'} className="transition-all duration-500" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {showMuscleDetail && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xl flex items-end animate-in fade-in duration-300">
            <div onClick={() => setShowMuscleDetail(false)} className="absolute inset-0"></div>
            <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 relative max-h-[85vh]">
              <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-5 mb-2 opacity-50"></div>
              <div className="p-8 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter">Foco Muscular</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => setShowMuscleDetail(false)} className="size-11 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all"><span className="material-symbols-outlined">close</span></button>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10 pb-20">
                {muscleData.length > 0 ? (
                  <>
                    <div className="h-64 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={muscleData} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                            {muscleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip content={({ active, payload }) => active && payload ? <div className="bg-black text-white px-3 py-1.5 rounded-xl text-[10px] font-black shadow-2xl">{payload[0].name}: {payload[0].payload.percent}%</div> : null} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                        <span className="text-2xl font-black tabular-nums">100%</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 px-1">Distribución del Top 5</p>
                      {muscleData.map((item) => (
                        <div key={item.name} className="bg-slate-50 dark:bg-background-dark/50 p-5 rounded-[2rem] border border-black/5 flex items-center justify-between group transition-all active:scale-[0.98]">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                               <span className="material-symbols-outlined font-black">fitness_center</span>
                            </div>
                            <div>
                               <p className="font-black text-sm uppercase tracking-tight">{item.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volumen: {item.value.toLocaleString()} {userProfile.weightUnit}</p>
                            </div>
                          </div>
                          <span className="text-xl font-black tabular-nums text-primary-text dark:text-primary">{item.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                    <span className="material-symbols-outlined text-7xl">donut_large</span>
                    <p className="text-sm font-black uppercase tracking-widest max-w-[200px]">Sin datos registrados para este mes</p>
                  </div>
                )}
              </div>
              <div className="p-8 pt-0"><button onClick={() => setShowMuscleDetail(false)} className="w-full py-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-[0.2em] shadow-2xl">Cerrar Desglose</button></div>
            </div>
          </div>
        )}

        <section className="space-y-6">
          <div className="px-1 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Evolución Global</p>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Récords Históricos</h3>
            </div>
            <span className="material-symbols-outlined text-primary text-3xl fill-1">stars</span>
          </div>

          {availableExercises.length > 0 ? (
            <>
              <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2">
                {availableExercises.map(ex => (
                  <button key={ex.id} onClick={() => setSelectedExerciseId(ex.id)} className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${selectedExerciseId === ex.id ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'bg-white dark:bg-surface-dark text-slate-400 border border-black/5'}`}>
                    {ex.name}
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-surface-dark p-7 rounded-[2.5rem] shadow-sm border border-black/5 relative overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h4 className="text-lg font-black tracking-tight leading-tight">{selectedExerciseName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tendencia de Peso Máximo</p>
                  </div>
                  {statsSummary && (
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary-text tracking-tighter">+{statsSummary.percent}%</p>
                      <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Mejora Total</p>
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
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip content={({ active, payload }) => active && payload && payload.length ? <div className="bg-black text-white px-4 py-2 rounded-2xl text-[12px] font-black shadow-2xl border border-white/10">{payload[0].value} {userProfile.weightUnit}</div> : null} />
                        <Area type="monotone" dataKey="weight" stroke="#FFEF0A" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" dot={{ r: 6, fill: '#FFEF0A', strokeWidth: 3, stroke: '#fff' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-56 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl animate-in zoom-in-95">
                    <div className="size-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl text-slate-300">query_stats</span>
                    </div>
                    <h5 className="text-sm font-black uppercase tracking-tight mb-2">Faltan Datos</h5>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-[200px] uppercase">
                      Se necesitan al menos <span className="text-primary-text dark:text-primary">2 sesiones</span> con este ejercicio para mostrar la línea de progreso.
                    </p>
                  </div>
                )}
                
                {statsSummary && (
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-background-dark/50 p-4 rounded-2xl border border-black/5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Inicio</p>
                      <p className="text-xl font-black">{statsSummary.start} {userProfile.weightUnit}</p>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                      <p className="text-[9px] font-black text-primary-text uppercase tracking-widest mb-1">Actual</p>
                      <p className="text-xl font-black text-primary-text">{statsSummary.current} {userProfile.weightUnit}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-surface-dark p-12 rounded-[3rem] shadow-sm border-2 border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center text-center animate-in slide-in-from-bottom-4">
               <div className="size-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary mb-8 shadow-inner">
                 <span className="material-symbols-outlined text-5xl font-black">fitness_center</span>
               </div>
               <h4 className="text-2xl font-black tracking-tighter mb-3">Tu Atlas de Progreso</h4>
               <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-[240px] mb-8">
                 Aún no tienes récords registrados. Los ejercicios que realices aparecerán aquí automáticamente para medir tu fuerza.
               </p>
               <button 
                onClick={() => onBack()} 
                className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
               >
                 ¡Empezar a entrenar ya!
               </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Stats;
