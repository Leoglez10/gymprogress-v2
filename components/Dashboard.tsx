
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid, AreaChart, Area, Tooltip } from 'recharts';
import { UserProfile, GoalType } from '../types';

interface DashboardProps {
  onStartWorkout: () => void;
  userAlias?: string;
  goal?: string;
}

interface WidgetMetadata {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  size: 'small' | 'medium' | 'large';
}

interface WidgetConfig extends WidgetMetadata {
  visible: boolean;
}

const WIDGET_CATALOG: WidgetMetadata[] = [
  { id: 'goal', title: 'Metas Activas', subtitle: 'Tu carrusel de progreso.', icon: 'ads_click', color: 'bg-black dark:bg-zinc-800', size: 'large' },
  { id: 'quick_stats', title: 'Rendimiento', subtitle: 'Racha y frecuencia.', icon: 'bolt', color: 'bg-orange-500/10', size: 'medium' },
  { id: 'volume_chart', title: 'Carga Semanal', subtitle: 'Volumen total movido.', icon: 'bar_chart', color: 'bg-primary/20', size: 'large' },
  { id: 'fatigue_risk', title: 'Recuperación', subtitle: 'Ratio de fatiga ACWR.', icon: 'ecg_heart', color: 'bg-green-500/10', size: 'small' },
  { id: 'muscle_dist', title: 'Enfoque Muscular', subtitle: 'Distribución de trabajo.', icon: 'pie_chart', color: 'bg-blue-500/10', size: 'medium' },
  { id: 'recent_prs', title: 'Récords (PR)', subtitle: 'Tus últimos hitos.', icon: 'star', color: 'bg-yellow-500/10', size: 'small' },
];

const METRIC_HELP = {
  volumen: {
    title: "Volumen Semanal",
    content: "Es la suma total de kg movidos (Peso x Repeticiones x Series) en los últimos 7 días. Es la métrica reina para medir la sobrecarga progresiva y el estímulo para la hipertrofia."
  },
  racha: {
    title: "Racha de Entrenamiento",
    content: "Mide tu consistencia. Se mantiene activa siempre que entrenes dentro de tu frecuencia semanal objetivo. ¡La constancia es lo que construye el físico!"
  },
  prs: {
    title: "Récords Personales (PR)",
    content: "Indica cuántas veces has superado tu peso máximo histórico en cualquier ejercicio este mes. Refleja tus ganancias de fuerza pura."
  },
  meta: {
    title: "Meta Global",
    content: "Es el promedio de cumplimiento de todos tus objetivos activos (Sesiones, Volumen y PRs). Llegar al 100% significa que has cumplido tu plan a la perfección."
  },
  sesiones: {
    title: "Sesiones Semanales",
    content: "Número de entrenamientos completados en los últimos 7 días. Ayuda a monitorizar si estás cumpliendo con el volumen de frecuencia necesario."
  }
};

const Dashboard: React.FC<DashboardProps> = ({ onStartWorkout, userAlias, goal }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showGoalPlanner, setShowGoalPlanner] = useState(false);
  const [showVolumeDetail, setShowVolumeDetail] = useState(false);
  const [activeHelp, setActiveHelp] = useState<keyof typeof METRIC_HELP | null>(null);
  
  useEffect(() => {
    const savedHistory = localStorage.getItem('gymProgress_workout_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedProfile = localStorage.getItem('gymProgress_user_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      if (!parsed.goalSettings.activeGoals) {
        parsed.goalSettings.activeGoals = ['sessions', 'prs'];
      }
      setUserProfile(parsed);
    }

    const savedWidgets = localStorage.getItem('gymProgress_dashboard_widgets_v3');
    if (savedWidgets) {
      try {
        const parsed = JSON.parse(savedWidgets);
        if (Array.isArray(parsed)) {
          const existingIds = parsed.map(p => p.id);
          const missing = WIDGET_CATALOG.filter(w => !existingIds.includes(w.id)).map(w => ({ ...w, visible: true }));
          setWidgets([...parsed, ...missing].filter(w => w && typeof w.visible === 'boolean'));
        } else {
          setWidgets(WIDGET_CATALOG.map(w => ({ ...w, visible: true })));
        }
      } catch (e) {
        setWidgets(WIDGET_CATALOG.map(w => ({ ...w, visible: true })));
      }
    } else {
      setWidgets(WIDGET_CATALOG.map(w => ({ ...w, visible: true })));
    }
  }, []);

  const saveWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('gymProgress_dashboard_widgets_v3', JSON.stringify(newWidgets));
  };

  const toggleWidget = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    saveWidgets(updated);
  };

  const handleReorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= widgets.length || to >= widgets.length) return;
    const newWidgets = [...widgets];
    const item = newWidgets[from];
    newWidgets.splice(from, 1);
    newWidgets.splice(to, 0, item);
    saveWidgets(newWidgets);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const currentWeekHistory = history.filter(w => new Date(w.date) >= oneWeekAgo);
    const previousWeekHistory = history.filter(w => {
      const d = new Date(w.date);
      return d >= twoWeeksAgo && d < oneWeekAgo;
    });

    const totalVolume = currentWeekHistory.reduce((acc, curr) => acc + curr.volume, 0);
    const prevWeekVolume = previousWeekHistory.reduce((acc, curr) => acc + curr.volume, 0);
    
    const muscleMap: Record<string, number> = {};
    currentWeekHistory.forEach(session => {
      session.exercises?.forEach((ex: any) => {
        const exVol = ex.sets.reduce((sAcc: number, sCurr: any) => sAcc + (sCurr.weight * sCurr.reps), 0);
        muscleMap[ex.muscleGroup] = (muscleMap[ex.muscleGroup] || 0) + exVol;
      });
    });

    const muscleDist = Object.entries(muscleMap).map(([name, value]) => ({
      name, value, percent: totalVolume > 0 ? Math.round((value / totalVolume) * 100) : 0
    })).sort((a, b) => b.value - a.value);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const historyPriorToMonth = history.filter(h => new Date(h.date) < startOfMonth);
    const currentMonthHistory = history.filter(h => new Date(h.date) >= startOfMonth);

    const exerciseBestPrior: Record<string, number> = {};
    historyPriorToMonth.forEach(session => {
      session.exercises?.forEach((ex: any) => {
        const max = Math.max(...ex.sets.map((s: any) => s.weight));
        exerciseBestPrior[ex.exerciseId] = Math.max(exerciseBestPrior[ex.exerciseId] || 0, max);
      });
    });

    let monthlyPrCount = 0;
    currentMonthHistory.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(session => {
      session.exercises?.forEach((ex: any) => {
        const max = Math.max(...ex.sets.map((s: any) => s.weight));
        if (max > (exerciseBestPrior[ex.exerciseId] || 0)) {
           monthlyPrCount++;
           exerciseBestPrior[ex.exerciseId] = max;
        }
      });
    });

    const allPrs: any[] = [];
    history.forEach(session => {
      session.exercises?.forEach((ex: any) => {
        const maxWeight = Math.max(...ex.sets.map((s: any) => s.weight));
        allPrs.push({ name: ex.name, weight: maxWeight, date: session.date });
      });
    });
    const recentPrs = allPrs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

    return { totalVolume, prevWeekVolume, muscleDist, recentPrs, sessionsCount: currentWeekHistory.length, monthlyPrCount };
  }, [history]);

  const dynamicGoals = useMemo(() => {
    if (!userProfile) return [];
    const goalsList = [];
    const sessionsThisMonth = history.filter(h => new Date(h.date).getMonth() === new Date().getMonth()).length;
    
    goalsList.push({
      id: 'sessions' as GoalType,
      label: 'Consistencia Mensual',
      current: sessionsThisMonth,
      target: userProfile.goalSettings.targetSessionsPerMonth,
      progress: Math.min(100, Math.round((sessionsThisMonth / userProfile.goalSettings.targetSessionsPerMonth) * 100)),
      unit: 'sesiones',
      icon: 'calendar_today',
      color: '#FFEF0A'
    });

    goalsList.push({
      id: 'prs' as GoalType,
      label: 'Récords del Mes',
      current: stats.monthlyPrCount,
      target: userProfile.goalSettings.targetPRsPerMonth,
      progress: Math.min(100, Math.round((stats.monthlyPrCount / userProfile.goalSettings.targetPRsPerMonth) * 100)),
      unit: 'récords superados',
      icon: 'stars',
      color: '#60a5fa'
    });

    goalsList.push({
      id: 'volume' as GoalType,
      label: 'Volumen Semanal',
      current: stats.totalVolume,
      target: userProfile.goalSettings.targetVolumePerWeek,
      progress: Math.min(100, Math.round((stats.totalVolume / userProfile.goalSettings.targetVolumePerWeek) * 100)),
      unit: 'kg movidos',
      icon: 'fitness_center',
      color: '#fb923c'
    });

    return goalsList.filter(g => userProfile.goalSettings.activeGoals.includes(g.id));
  }, [userProfile, history, stats]);

  const chartData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const vol = history
        .filter(w => new Date(w.date).toDateString() === d.toDateString())
        .reduce((acc, curr) => acc + curr.volume, 0);
      result.push({ day: days[d.getDay()], volume: vol || 50, isReal: vol > 0 });
    }
    return result;
  }, [history]);

  const globalProgress = useMemo(() => {
    if (dynamicGoals.length === 0) return 0;
    const sum = dynamicGoals.reduce((acc, g) => acc + g.progress, 0);
    return Math.round(sum / dynamicGoals.length);
  }, [dynamicGoals]);

  const HelpIcon = ({ metric }: { metric: keyof typeof METRIC_HELP }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); setActiveHelp(metric); }}
      className="ml-1.5 size-5 inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-primary transition-colors active:scale-90"
    >
      <span className="material-symbols-outlined text-[12px] font-black">help</span>
    </button>
  );

  return (
    <div className="pb-64 bg-background-light dark:bg-background-dark min-h-full transition-all relative">
      <div className="pt-[env(safe-area-inset-top)] px-6 pb-6 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
             <div className="size-14 rounded-2xl bg-black dark:bg-white flex items-center justify-center text-primary dark:text-black shadow-xl">
                <span className="material-symbols-outlined font-black text-3xl">bolt</span>
             </div>
             <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Resumen</p>
                <h2 className="text-3xl font-black tracking-tighter leading-tight">{userAlias || 'Atleta'}</h2>
             </div>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`size-14 rounded-2xl shadow-xl border flex items-center justify-center transition-all active:scale-90 ${isEditing ? 'bg-primary text-black border-primary' : 'bg-white dark:bg-surface-dark text-slate-400 border-black/5'}`}
          >
            <span className="material-symbols-outlined text-3xl font-black">{isEditing ? 'done' : 'tune'}</span>
          </button>
        </div>

        {!isEditing && (
          <div className="bg-white dark:bg-surface-dark p-7 rounded-[3rem] shadow-2xl shadow-black/5 border border-black/5 flex items-center justify-around animate-in slide-in-from-top duration-700">
             <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Racha</p>
                  <HelpIcon metric="racha" />
                </div>
                <p className="text-2xl font-black tracking-tight">5 Días</p>
             </div>
             <div className="w-px h-10 bg-slate-100 dark:bg-white/10"></div>
             <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PRs Mes</p>
                  <HelpIcon metric="prs" />
                </div>
                <p className="text-2xl font-black tracking-tight">{stats.monthlyPrCount}</p>
             </div>
             <div className="w-px h-10 bg-slate-100 dark:bg-white/10"></div>
             <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Meta Global</p>
                  <HelpIcon metric="meta" />
                </div>
                <p className="text-2xl font-black tracking-tight">{globalProgress}%</p>
             </div>
          </div>
        )}
      </div>

      <div className="px-5 space-y-12 transition-all duration-500">
        {isEditing && (
          <div className="bg-primary/10 text-primary-text dark:text-white p-6 rounded-[2.5rem] mb-4 animate-in fade-in flex items-center gap-4 border border-primary/20">
            <span className="material-symbols-outlined text-primary font-black text-3xl">dashboard_customize</span>
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
              Personaliza tu dashboard. Arrastra para ordenar u oculta widgets.
            </p>
          </div>
        )}

        {widgets.map((widget, index) => {
          if (!widget || (!widget.visible && !isEditing)) return null;

          return (
            <div 
              key={widget.id}
              className={`relative transition-all duration-300 ${isEditing && !widget.visible ? 'opacity-30 scale-95 grayscale blur-[1px]' : 'opacity-100 scale-100'}`}
            >
              {isEditing && (
                <div className="absolute -top-6 left-0 right-0 z-[60] flex items-center justify-between px-2 pointer-events-none translate-y-[-50%]">
                  <div className="flex items-center gap-1.5 bg-black dark:bg-zinc-800 p-1.5 rounded-2xl shadow-2xl border border-white/10 pointer-events-auto">
                    <button onClick={() => handleReorder(index, index - 1)} disabled={index === 0} className="size-11 flex items-center justify-center rounded-xl active:bg-primary disabled:opacity-20 transition-all text-white"><span className="material-symbols-outlined text-2xl font-black">keyboard_arrow_up</span></button>
                    <button onClick={() => handleReorder(index, index + 1)} disabled={index === widgets.length - 1} className="size-11 flex items-center justify-center rounded-xl active:bg-primary disabled:opacity-20 transition-all text-white"><span className="material-symbols-outlined text-2xl font-black">keyboard_arrow_down</span></button>
                  </div>
                  <div className="pointer-events-auto">
                    <button onClick={() => toggleWidget(widget.id)} className={`size-14 rounded-2xl shadow-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${widget.visible ? 'bg-primary text-black border-primary' : 'bg-white dark:bg-zinc-800 text-slate-300 border-black/5'}`}><span className="material-symbols-outlined text-2xl font-black">{widget.visible ? 'visibility' : 'visibility_off'}</span></button>
                  </div>
                </div>
              )}
              
              <WidgetContent 
                id={widget.id} 
                stats={stats} 
                dynamicGoals={dynamicGoals} 
                chartData={chartData}
                onAdjustGoal={() => setShowGoalPlanner(true)}
                onShowVolumeDetail={() => setShowVolumeDetail(true)}
                onShowHelp={setActiveHelp}
              />
            </div>
          );
        })}
      </div>

      {!isEditing && (
        <div className="fixed bottom-28 left-0 right-0 px-8 z-40 animate-in slide-in-from-bottom duration-500">
          <button onClick={onStartWorkout} className="w-full h-24 bg-primary text-black font-black text-2xl rounded-full shadow-[0_25px_50px_-12px_rgba(255,239,10,0.5)] flex items-center justify-center gap-5 active:scale-[0.97] transition-all group">
            <div className="size-12 bg-black text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg"><span className="material-symbols-outlined text-3xl fill-1 font-black">play_arrow</span></div>
            ENTRENAR AHORA
          </button>
        </div>
      )}

      {/* MODAL DE AYUDA DE MÉTRICAS */}
      {activeHelp && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div onClick={() => setActiveHelp(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-xs bg-white dark:bg-surface-dark rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl font-black">help</span>
            </div>
            <h3 className="text-xl font-black tracking-tight mb-4">{METRIC_HELP[activeHelp].title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
              {METRIC_HELP[activeHelp].content}
            </p>
            <button 
              onClick={() => setActiveHelp(null)}
              className="w-full py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showGoalPlanner && userProfile && (
        <GoalPlannerModal 
          userProfile={userProfile} 
          onClose={() => setShowGoalPlanner(false)} 
          onSave={(newProfile) => {
            setUserProfile(newProfile);
            localStorage.setItem('gymProgress_user_profile', JSON.stringify(newProfile));
          }}
        />
      )}

      {showVolumeDetail && (
        <VolumeDetailModal 
          chartData={chartData} 
          totalVolume={stats.totalVolume} 
          prevVolume={stats.prevWeekVolume}
          onClose={() => setShowVolumeDetail(false)} 
        />
      )}
    </div>
  );
};

const VolumeDetailModal: React.FC<{ chartData: any[], totalVolume: number, prevVolume: number, onClose: () => void }> = ({ chartData, totalVolume, prevVolume, onClose }) => {
  const trend = useMemo(() => {
    if (prevVolume === 0) return { percent: totalVolume > 0 ? 100 : 0, up: true };
    const diff = ((totalVolume - prevVolume) / prevVolume) * 100;
    return { percent: Math.round(diff), up: diff >= 0 };
  }, [totalVolume, prevVolume]);

  const insight = useMemo(() => {
    const p = trend.percent;
    const up = trend.up;

    const messages = {
      explosive: [
        "¡Progreso de manual! Estás aplicando una sobrecarga progresiva perfecta. Sigue así.",
        "Crecimiento explosivo detectado. Tus fibras musculares están respondiendo al máximo nivel.",
        "Nivel Pro: Has superado tu marca anterior con autoridad. La fuerza es tu nueva norma."
      ],
      solid: [
        "Consistencia sólida. Mantener este ritmo es la clave para ver cambios reales a largo plazo.",
        "Buen trabajo. Estás consolidando tus ganancias antes del siguiente salto de carga.",
        "Progreso constante. No siempre hay que romper récords, hoy has sumado una victoria."
      ],
      maintenance: [
        "Zona de estabilidad. Mantener el volumen es fundamental para no retroceder en periodos de estrés.",
        "Hoy has cumplido. No siempre se puede subir, pero mantenerse ya es ganar.",
        "Punto de equilibrio. Usa esta semana para perfeccionar la técnica de tus levantamientos."
      ],
      deload: [
        "Descarga inteligente. Tu cuerpo necesita estos periodos para regenerar tejidos y evitar lesiones.",
        "Semana de ajuste. Un ligero descenso es normal; prioriza el descanso y la nutrición hoy.",
        "Escucha a tu cuerpo. Has bajado un poco el ritmo, lo cual es vital para volver con más fuerza."
      ],
      alert: [
        "Alerta de desentrenamiento. Si no es una semana de descanso planeada, intenta retomar tu volumen previo.",
        "Bajada significativa. Asegúrate de que tu motivación y energía estén en el punto correcto.",
        "Has bajado el volumen notablemente. ¡Vuelve a la carga lo antes posible para no perder racha!"
      ]
    };

    let selectedKey: keyof typeof messages;
    let label = "MANTENIMIENTO";
    let color = "text-slate-400";

    if (p > 20) { selectedKey = 'explosive'; label = "SOBRECARGA ELITE"; color = "text-primary"; }
    else if (p >= 5) { selectedKey = 'solid'; label = "PROGRESIÓN ÓPTIMA"; color = "text-primary"; }
    else if (p > -5) { selectedKey = 'maintenance'; label = "ZONA ESTABLE"; color = "text-slate-400"; }
    else if (p > -20) { selectedKey = 'deload'; label = "DESCARGA ACTIVA"; color = "text-orange-500"; }
    else { selectedKey = 'alert'; label = "PÉRDIDA DE CARGA"; color = "text-red-500"; }

    const randomIdx = Math.abs(totalVolume + prevVolume) % messages[selectedKey].length;
    
    return {
      message: messages[selectedKey][randomIdx],
      label,
      color
    };
  }, [trend, totalVolume, prevVolume]);

  return (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-3xl flex items-end animate-in fade-in duration-300 p-4 pb-0">
      <div onClick={onClose} className="absolute inset-0"></div>
      <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] p-8 pb-16 shadow-2xl animate-in slide-in-from-bottom duration-500 relative flex flex-col max-h-[96vh] overflow-y-auto no-scrollbar">
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8 opacity-40"></div>
        
        <div className="flex items-center justify-between mb-10 px-2">
          <div>
            <h3 className="text-3xl font-black tracking-tighter leading-none">Análisis de Carga</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Tendencia Semanal</p>
          </div>
          <button onClick={onClose} className="size-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-background-dark/50 rounded-[3.5rem] p-10 mb-10 border border-black/5 flex flex-col items-center">
           <div className="relative mb-8 flex items-center justify-center w-full">
              <div className={`size-48 aspect-square rounded-full border-[10px] flex flex-col items-center justify-center bg-white dark:bg-surface-dark shadow-2xl transition-all ${trend.up ? 'border-primary shadow-primary/10' : 'border-orange-500 shadow-orange-500/10'}`}>
                 <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Carga</span>
                 <span className="text-6xl font-black tabular-nums tracking-tighter leading-none flex items-center justify-center">{trend.percent}%</span>
                 <div className="mt-2 h-8 flex items-center justify-center">
                    <span className={`material-symbols-outlined text-4xl font-black leading-none ${trend.up ? 'text-primary' : 'text-orange-500'}`}>
                        {trend.up ? 'trending_up' : 'trending_down'}
                    </span>
                 </div>
              </div>
           </div>

           <div className="text-center space-y-6 w-full">
              <div className="space-y-1">
                <h4 className={`text-[12px] font-black uppercase tracking-[0.3em] ${insight.color}`}>{insight.label}</h4>
                <div className="h-1.5 w-12 bg-slate-200 dark:bg-white/10 mx-auto rounded-full"></div>
              </div>
              
              <div className="bg-white dark:bg-surface-dark p-9 rounded-[3rem] shadow-sm border border-black/5 w-full relative min-h-[140px] flex items-center justify-center">
                 <div className="absolute top-4 left-6 pointer-events-none opacity-20">
                    <span className="material-symbols-outlined text-5xl font-black text-primary leading-none">format_quote</span>
                 </div>
                 <p className="text-lg font-medium leading-relaxed italic text-slate-700 dark:text-slate-300 relative z-10 text-center px-4">
                    "{insight.message}"
                 </p>
                 <div className="absolute bottom-4 right-6 pointer-events-none opacity-20 rotate-180">
                    <span className="material-symbols-outlined text-5xl font-black text-primary leading-none">format_quote</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-4 mb-10">
           <div className="flex items-center justify-between px-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Carga Diaria (7D)</p>
           </div>
           <div className="h-60 w-full bg-slate-50 dark:bg-background-dark/50 rounded-[3rem] p-6 border border-black/5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFEF0A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FFEF0A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: '900', fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{ stroke: '#FFEF0A', strokeWidth: 2 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-black text-white px-4 py-2 rounded-2xl text-[12px] font-black shadow-2xl">
                          {payload[0].value.toLocaleString()} kg
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="volume" stroke="#FFEF0A" strokeWidth={4} fillOpacity={1} fill="url(#colorVol)" />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-10">
           <div className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] border border-black/5 flex flex-col items-center text-center shadow-sm">
              <div className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                 <span className="material-symbols-outlined text-slate-400 text-xl">event_available</span>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Esta Semana</p>
              <p className="text-2xl font-black tracking-tight tabular-nums">{totalVolume.toLocaleString()} <span className="text-[10px] font-bold">kg</span></p>
           </div>
           <div className="bg-white dark:bg-surface-dark p-8 rounded-[2.5rem] border border-black/5 flex flex-col items-center text-center shadow-sm">
              <div className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3">
                 <span className="material-symbols-outlined text-slate-400 text-xl">history</span>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Semana Ant.</p>
              <p className="text-2xl font-black tracking-tight tabular-nums">{prevVolume.toLocaleString()} <span className="text-[10px] font-bold">kg</span></p>
           </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full h-24 rounded-[2.5rem] bg-black dark:bg-white text-white dark:text-black font-black text-xl active:scale-95 transition-all shadow-2xl uppercase tracking-[0.2em] flex items-center justify-center leading-none text-center"
        >
          <span className="block translate-y-[1px] w-full px-4 truncate">CONTINUAR ENTRENANDO</span>
        </button>
      </div>
    </div>
  );
};

const GoalPlannerModal: React.FC<{ userProfile: UserProfile, onClose: () => void, onSave: (p: UserProfile) => void }> = ({ userProfile, onClose, onSave }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>({ ...userProfile });
  const [activeTab, setActiveTab] = useState<GoalType>('sessions');

  const toggleGoalVisibility = (type: GoalType) => {
    const current = localProfile.goalSettings.activeGoals;
    const next = current.includes(type) ? current.filter(g => g !== type) : [...current, type];
    setLocalProfile({ ...localProfile, goalSettings: { ...localProfile.goalSettings, activeGoals: next } });
  };

  const updateTarget = (type: GoalType, delta: number) => {
    const settings = { ...localProfile.goalSettings };
    if (type === 'sessions') settings.targetSessionsPerMonth = Math.max(1, (settings.targetSessionsPerMonth || 12) + delta);
    if (type === 'prs') settings.targetPRsPerMonth = Math.max(1, (settings.targetPRsPerMonth || 5) + delta);
    if (type === 'volume') settings.targetVolumePerWeek = Math.max(1000, (settings.targetVolumePerWeek || 10000) + delta * 500);
    setLocalProfile({ ...localProfile, goalSettings: settings });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-2xl flex items-end animate-in fade-in duration-300">
      <div onClick={onClose} className="absolute inset-0"></div>
      <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] p-10 pb-16 shadow-2xl animate-in slide-in-from-bottom duration-500 relative flex flex-col">
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-10 opacity-40"></div>
        <h3 className="text-3xl font-black tracking-tighter mb-8 text-center">Mis Objetivos</h3>
        
        <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar justify-center">
          {(['sessions', 'prs', 'volume'] as GoalType[]).map(type => (
            <button 
              key={type} 
              onClick={() => setActiveTab(type)}
              className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2 ${activeTab === type ? 'bg-primary border-primary text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'}`}
            >
              {type === 'sessions' ? 'Entrenos' : type === 'prs' ? 'PRs Fuerza' : 'Carga Semanal'}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-10 py-4">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-background-dark p-6 rounded-[2.5rem]">
            <div className="flex items-center gap-4">
               <div className={`size-12 rounded-xl flex items-center justify-center ${localProfile.goalSettings.activeGoals.includes(activeTab) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                 <span className="material-symbols-outlined">{activeTab === 'sessions' ? 'calendar_today' : activeTab === 'prs' ? 'stars' : 'fitness_center'}</span>
               </div>
               <div>
                 <p className="font-black text-lg leading-tight">{activeTab === 'sessions' ? 'Sesiones/mes' : activeTab === 'prs' ? 'Récords/mes' : 'Volumen/sem (kg)'}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{localProfile.goalSettings.activeGoals.includes(activeTab) ? 'Visible' : 'Oculto'}</p>
               </div>
            </div>
            <button 
              onClick={() => toggleGoalVisibility(activeTab)}
              className={`size-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${localProfile.goalSettings.activeGoals.includes(activeTab) ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}
            >
              <span className="material-symbols-outlined font-black">{localProfile.goalSettings.activeGoals.includes(activeTab) ? 'check' : 'add'}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-12">
            <button onClick={() => updateTarget(activeTab, activeTab === 'volume' ? -500 : -1)} className="size-20 rounded-full bg-slate-100 dark:bg-background-dark flex items-center justify-center text-slate-500 active:scale-75 transition-all shadow-inner border border-black/5"><span className="material-symbols-outlined text-4xl font-black">remove</span></button>
            <div className="text-center">
              <span className="text-7xl font-black tabular-nums tracking-tighter">
                {activeTab === 'sessions' ? localProfile.goalSettings.targetSessionsPerMonth : activeTab === 'prs' ? localProfile.goalSettings.targetPRsPerMonth : (localProfile.goalSettings.targetVolumePerWeek / 1000).toFixed(0) + 'k'}
              </span>
            </div>
            <button onClick={() => updateTarget(activeTab, activeTab === 'volume' ? 500 : 1)} className="size-20 rounded-full bg-slate-100 dark:bg-background-dark flex items-center justify-center text-slate-500 active:scale-75 transition-all shadow-inner border border-black/5"><span className="material-symbols-outlined text-4xl font-black">add</span></button>
          </div>
        </div>

        <button 
          onClick={() => { onSave(localProfile); onClose(); }} 
          className="w-full py-8 mt-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-xl active:scale-95 transition-all shadow-2xl uppercase tracking-[0.2em]"
        >
          GUARDAR AJUSTES
        </button>
      </div>
    </div>
  );
};

const WidgetContent: React.FC<{ 
  id: string; 
  stats: any; 
  dynamicGoals: any[]; 
  chartData: any; 
  onAdjustGoal: () => void;
  onShowVolumeDetail: () => void;
  onShowHelp: (metric: keyof typeof METRIC_HELP) => void;
}> = ({ id, stats, dynamicGoals, chartData, onAdjustGoal, onShowVolumeDetail, onShowHelp }) => {
  const [activeGoalIdx, setActiveGoalIdx] = useState(0);

  useEffect(() => {
    if (activeGoalIdx >= dynamicGoals.length && dynamicGoals.length > 0) {
      setActiveGoalIdx(0);
    }
  }, [dynamicGoals.length]);

  const MetricLabelHelp = ({ label, metric }: { label: string, metric: keyof typeof METRIC_HELP }) => (
    <div className="flex items-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <button 
        onClick={(e) => { e.stopPropagation(); onShowHelp(metric); }}
        className="ml-1.5 size-4 inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[10px] font-black">help</span>
      </button>
    </div>
  );

  switch (id) {
    case 'goal':
      const currentGoal = dynamicGoals[activeGoalIdx] || dynamicGoals[0];
      if (!currentGoal) {
        return (
          <div className="bg-black dark:bg-zinc-900 rounded-[4rem] p-12 text-white min-h-[460px] flex flex-col items-center justify-center gap-6 border border-white/5 text-center">
             <span className="material-symbols-outlined text-6xl text-slate-700">ads_click</span>
             <h3 className="text-2xl font-black">Sin Metas</h3>
             <button onClick={onAdjustGoal} className="mt-4 px-10 py-4 bg-primary text-black rounded-full text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Configurar</button>
          </div>
        );
      }

      return (
        <div className="bg-black dark:bg-zinc-900 rounded-[4rem] p-10 text-white min-h-[460px] flex flex-col items-center justify-center gap-8 shadow-2xl animate-in fade-in border border-white/5 relative overflow-hidden">
          
          <div 
            className="relative size-56 shrink-0 flex items-center justify-center cursor-pointer select-none group"
            onClick={() => setActiveGoalIdx((prev) => (prev + 1) % dynamicGoals.length)}
          >
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
            <svg className="size-full transform -rotate-90 absolute top-0 left-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
              <circle 
                cx="50" cy="50" r="44" 
                stroke={currentGoal.color} strokeWidth="8" fill="transparent" 
                strokeDasharray="276.46" 
                strokeDashoffset={276.46 - (276.46 * currentGoal.progress) / 100} 
                strokeLinecap="round" 
                className="transition-all duration-700 ease-in-out" 
              />
            </svg>
            <div className="flex flex-col items-center justify-center z-10 animate-in zoom-in-95 duration-500" key={currentGoal.id}>
              <span className="material-symbols-outlined text-3xl mb-1" style={{ color: currentGoal.color }}>{currentGoal.icon}</span>
              <span className="text-6xl font-black tabular-nums tracking-tighter leading-none">{currentGoal.progress}%</span>
            </div>
          </div>

          <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-500" key={currentGoal.label}>
            <h3 className="text-3xl font-black tracking-tight mb-2">{currentGoal.label}</h3>
            <p className="text-slate-400 text-base font-medium">
              {currentGoal.current.toLocaleString()} de {currentGoal.target.toLocaleString()} {currentGoal.unit}
            </p>
            
            <div className="flex justify-center gap-2 mt-8">
              {dynamicGoals.map((_, i) => (
                <button 
                  key={i} 
                  onClick={(e) => { e.stopPropagation(); setActiveGoalIdx(i); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeGoalIdx === i ? 'w-8 bg-primary' : 'w-1.5 bg-white/10 hover:bg-white/20'}`}
                />
              ))}
            </div>

            <button onClick={onAdjustGoal} className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 active:scale-95 transition-all">Gestionar Objetivos</button>
          </div>
        </div>
      );

    case 'quick_stats':
      return (
        <div className="grid grid-cols-2 gap-5 animate-in fade-in">
          <div className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-8 border border-black/5 shadow-xl">
             <div className="size-16 rounded-2xl bg-orange-100 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mb-6 shadow-inner"><span className="material-symbols-outlined font-black text-4xl">local_fire_department</span></div>
             <MetricLabelHelp label="Racha" metric="racha" />
             <p className="text-4xl font-black tabular-nums mt-1 tracking-tighter">5 Días</p>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-8 border border-black/5 shadow-xl">
             <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center mb-6 shadow-inner"><span className="material-symbols-outlined font-black text-4xl">calendar_month</span></div>
             <MetricLabelHelp label="Sesiones" metric="sesiones" />
             <p className="text-4xl font-black tabular-nums mt-1 tracking-tighter">{stats.sessionsCount}/sem</p>
          </div>
        </div>
      );

    case 'volume_chart':
      return (
        <div className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-10 shadow-xl border border-black/5 animate-in fade-in relative overflow-hidden group">
          <div className="flex justify-between items-start mb-10">
            <div>
              <MetricLabelHelp label="Volumen Semanal" metric="volumen" />
              <h4 className="text-5xl font-black tracking-tighter tabular-nums leading-none mt-1">{stats.totalVolume.toLocaleString()} <span className="text-lg text-slate-300 font-black ml-1">kg</span></h4>
            </div>
            
            <button 
              onClick={onShowVolumeDetail}
              className="size-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl active:scale-90 transition-all hover:rotate-12"
              title="Análisis de carga"
            >
              <span className="material-symbols-outlined text-2xl font-black">query_stats</span>
            </button>
          </div>

          <div className="h-56 w-full cursor-pointer" onClick={onShowVolumeDetail}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="volume" radius={[14, 14, 14, 14]} barSize={40}>
                  {chartData.map((entry: any, idx: number) => <Cell key={`c-${idx}`} fill={entry.isReal ? '#FFEF0A' : '#f1f5f9'} className={!entry.isReal ? 'dark:fill-white/5' : ''} />)}
                </Bar>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: '900', fill: '#94a3b8'}} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );

    case 'fatigue_risk':
      return (
        <div className="bg-white dark:bg-surface-dark rounded-[4rem] p-10 border border-black/5 flex items-center justify-between animate-in fade-in shadow-xl">
          <div className="flex items-center gap-8">
            <div className="size-20 rounded-[2.2rem] bg-green-500/10 flex items-center justify-center text-green-500 shadow-inner"><span className="material-symbols-outlined text-4xl font-black animate-pulse">ecg_heart</span></div>
            <div>
              <h4 className="font-black text-2xl tracking-tighter leading-none">Zona Óptima</h4>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-2">Status: Recuperado</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-200 text-4xl font-black">chevron_right</span>
        </div>
      );

    case 'muscle_dist':
      return (
        <div className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-12 border border-black/5 animate-in fade-in shadow-xl">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-10 text-center">Foco Muscular</h4>
          <div className="flex items-center gap-12">
            <div className="size-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.muscleDist.length > 0 ? stats.muscleDist : [{value: 1}]} innerRadius={45} outerRadius={75} paddingAngle={12} dataKey="value" stroke="none">
                    {stats.muscleDist.map((_: any, i: number) => <Cell key={i} fill={['#FFEF0A', '#E6D709', '#CCBF08'][i % 3]} />)}
                    {stats.muscleDist.length === 0 && <Cell fill="#f1f5f9" className="dark:fill-white/5" />}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-6">
              {stats.muscleDist.slice(0, 3).map((item: any) => (
                <div key={item.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400 truncate pr-4">{item.name}</span>
                    <span className="text-slate-950 dark:text-white font-black">{item.percent}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-primary shadow-[0_0_15px_rgba(255,239,10,0.6)]" style={{ width: `${item.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'recent_prs':
      return (
        <div className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-12 border border-black/5 animate-in fade-in shadow-xl">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-10">Tus Récords</h4>
          <div className="space-y-8">
            {stats.recentPrs.length > 0 ? stats.recentPrs.map((pr: any, i: number) => (
              <div key={i} className="flex items-center gap-8">
                <div className="size-16 rounded-[1.8rem] bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner"><span className="material-symbols-outlined text-4xl font-black">star</span></div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-2xl truncate tracking-tighter leading-none">{pr.name}</p>
                  <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-2">PB: {pr.weight}kg</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400 font-bold italic tracking-wide">¡Sigue entrenando!</p>}
          </div>
        </div>
      );

    default: return null;
  }
};

export default Dashboard;
