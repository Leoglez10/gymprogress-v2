
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, AreaChart, Area } from 'recharts';

interface StatsProps {
  onBack: () => void;
}

const Stats: React.FC<StatsProps> = ({ onBack }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gymProgress_workout_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistory(parsed);
      
      // Intentar seleccionar el primer ejercicio con datos por defecto
      if (parsed.length > 0) {
        for (const session of parsed) {
          if (session.exercises && session.exercises.length > 0) {
            setSelectedExerciseId(session.exercises[0].exerciseId);
            break;
          }
        }
      }
    }
  }, []);

  // Extraer todos los ejercicios únicos del historial
  const availableExercises = useMemo(() => {
    const map = new Map();
    history.forEach(session => {
      if (session.exercises) {
        session.exercises.forEach((ex: any) => {
          if (!map.has(ex.exerciseId)) {
            map.set(ex.exerciseId, { id: ex.exerciseId, name: ex.name });
          }
        });
      }
    });
    return Array.from(map.values());
  }, [history]);

  // Calcular la progresión de PR para el ejercicio seleccionado
  const prProgression = useMemo(() => {
    if (!selectedExerciseId) return [];
    
    const progression: { date: string, weight: number, timestamp: number }[] = [];
    
    // Ordenamos historia por fecha
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedHistory.forEach(session => {
      if (session.exercises) {
        const exerciseSession = session.exercises.find((ex: any) => ex.exerciseId === selectedExerciseId);
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

  // Mock data para las otras secciones si no hay suficiente historia real
  const volumeData = [
    { month: 'Ene', volume: 45000 },
    { month: 'Feb', volume: 52000 },
    { month: 'Mar', volume: 48000 },
    { month: 'Abr', volume: 61000 },
    { month: 'May', volume: 55000 },
    { month: 'Jun', volume: 67000 },
  ];

  const muscleData = [
    { name: 'Pecho', value: 30, color: '#FFEF0A' },
    { name: 'Espalda', value: 25, color: '#E6D709' },
    { name: 'Piernas', value: 20, color: '#CCBF08' },
    { name: 'Hombros', value: 15, color: '#B3A707' },
    { name: 'Otros', value: 10, color: '#998F06' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark pb-32 animate-in fade-in duration-500">
      <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 pt-[env(safe-area-inset-top)]">
        <button onClick={onBack} className="flex size-11 items-center justify-center rounded-full hover:bg-black/5 transition-all">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold">Análisis Pro</h2>
        <div className="size-11"></div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-8 overflow-y-auto no-scrollbar">
        {/* SECCIÓN DE PR PROGRESSION */}
        <section className="space-y-6">
          <div className="px-1 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Evolución de Cargas</p>
              <h3 className="text-2xl font-black tracking-tighter">Récords Personales</h3>
            </div>
            <span className="material-symbols-outlined text-primary text-3xl fill-1">trending_up</span>
          </div>

          {/* Selector de Ejercicios */}
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

          {/* Gráfico de PR */}
          <div className="bg-white dark:bg-surface-dark p-7 rounded-[2.5rem] shadow-sm border border-black/5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h4 className="text-lg font-black tracking-tight leading-tight">{selectedExerciseName}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Historial de peso máximo</p>
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
                    <YAxis 
                      hide
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip 
                      cursor={{ stroke: '#FFEF0A', strokeWidth: 2 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black text-white px-4 py-2 rounded-2xl text-[12px] font-black shadow-2xl border border-white/10">
                              {payload[0].value} kg
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
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-3xl">
                <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">analytics</span>
                <p className="text-xs text-slate-400 font-medium">Se necesitan al menos 2 sesiones con este ejercicio para ver la tendencia.</p>
              </div>
            )}

            {statsSummary && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-background-dark/50 p-4 rounded-2xl border border-black/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Peso Inicial</p>
                  <p className="text-xl font-black">{statsSummary.start} kg</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <p className="text-[9px] font-black text-primary-text uppercase tracking-widest mb-1">Ganancia Neta</p>
                  <p className="text-xl font-black text-primary-text">+{statsSummary.diff} kg</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* VOLUMEN MENSUAL */}
        <div className="bg-white dark:bg-surface-dark p-7 rounded-[2.5rem] shadow-sm border border-black/5">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Volumen Mensual (kg)</h3>
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

        {/* DISTRIBUCIÓN MUSCULAR */}
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
