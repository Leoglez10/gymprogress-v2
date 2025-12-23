
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid, AreaChart, Area, Tooltip } from 'recharts';
import { UserProfile, GoalType, CustomRoutine, CustomExerciseEntry } from '../types';
import { getVolumeInsight, getTargetVolumeRecommendation } from '../services/geminiService';

interface DashboardProps {
  onStartWorkout: () => void;
  onStartDirectWorkout?: (routine: CustomRoutine) => void;
  onNavigateToStats?: () => void;
  userAlias?: string;
  avatarUrl?: string;
  goal?: string;
  isFooterVisible?: boolean;
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

const ALL_MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core'];

const METRIC_HELP = {
  volumen: {
    title: "Volumen Semanal",
    content: "Es la suma total de kg movidos (Peso x Repeticiones x Series) en los últimos 7 días. Es la métrica reina para medir la sobrecarga progresiva."
  },
  racha: {
    title: "Racha de Entrenamiento",
    content: "Mide tu consistencia de días consecutivos entrenando. La racha se mantiene si entrenas al menos una vez cada 24-48 horas."
  },
  prs: {
    title: "Récords Personales (PR)",
    content: "Indica cuántas veces has superado tu peso máximo histórico en cualquier ejercicio este mes."
  },
  meta: {
    title: "Meta Global",
    content: "Es el promedio de cumplimiento de todos tus objetivos activos (Sesiones, Volumen y PRs)."
  },
  sesiones: {
    title: "Sesiones Semanales",
    content: "Número de entrenamientos completados en los últimos 7 días."
  }
};

const MetricLabelHelp = ({ label, metric, onShowHelp }: { label: string, metric: keyof typeof METRIC_HELP, onShowHelp: (m: keyof typeof METRIC_HELP) => void }) => (
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

const Dashboard: React.FC<DashboardProps> = ({ onStartWorkout, onStartDirectWorkout, onNavigateToStats, userAlias, avatarUrl, goal, isFooterVisible = true }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showGoalPlanner, setShowGoalPlanner] = useState(false);
  const [showVolumeDetail, setShowVolumeDetail] = useState(false);
  const [showFatigueDetail, setShowFatigueDetail] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [activeHelp, setActiveHelp] = useState<keyof typeof METRIC_HELP | null>(null);
  const [displayMode, setDisplayMode] = useState<'alias' | 'greeting'>('alias');
  
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayMode(prev => prev === 'alias' ? 'greeting' : 'alias');
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '¡Buen día!';
    if (hour >= 12 && hour < 20) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('gymProgress_workout_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedProfile = localStorage.getItem('gymProgress_user_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      if (!parsed.goalSettings.activeGoals) {
        parsed.goalSettings.activeGoals = ['sessions', 'prs', 'volume'];
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
          const filtered = [...parsed, ...missing].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setWidgets(filtered.filter(w => w && typeof w.visible === 'boolean' && WIDGET_CATALOG.some(cat => cat.id === w.id)));
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
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const historyWeek = history.filter(w => new Date(w.date) >= startOfWeek);
    const historyPrevWeek = history.filter(w => {
      const d = new Date(w.date);
      return d >= prevWeekStart && d < startOfWeek;
    });

    const muscleMap: Record<string, number> = {};
    const prevMuscleMap: Record<string, number> = {};
    ALL_MUSCLE_GROUPS.forEach(g => { muscleMap[g] = 0; prevMuscleMap[g] = 0; });

    let calculatedTotalVolume = 0;
    historyWeek.forEach(session => {
      session.exercises?.forEach((ex: any) => {
        const exVol = (ex.sets || []).reduce((sAcc: number, sCurr: any) => 
          sAcc + (sCurr.completed ? (Number(sCurr.weight) * Number(sCurr.reps)) : 0), 0);
        
        const mGroup = ALL_MUSCLE_GROUPS.includes(ex.muscleGroup) ? ex.muscleGroup : 'Core';
        muscleMap[mGroup] = (muscleMap[mGroup] || 0) + exVol;
        calculatedTotalVolume += exVol;
      });
    });

    let calculatedPrevVolume = 0;
    historyPrevWeek.forEach(session => {
      session.exercises?.forEach((ex: any) => {
        const exVol = (ex.sets || []).reduce((sAcc: number, sCurr: any) => 
          sAcc + (sCurr.completed ? (Number(sCurr.weight) * Number(sCurr.reps)) : 0), 0);
        
        const mGroup = ALL_MUSCLE_GROUPS.includes(ex.muscleGroup) ? ex.muscleGroup : 'Core';
        prevMuscleMap[mGroup] = (prevMuscleMap[mGroup] || 0) + exVol;
        calculatedPrevVolume += exVol;
      });
    });

    const totalVolume = calculatedTotalVolume;
    const prevWeekVolume = calculatedPrevVolume;

    const muscleDist = Object.entries(muscleMap)
      .map(([name, value]) => ({
        name, 
        value, 
        percent: totalVolume > 0 ? Math.round((value / totalVolume) * 100) : 0,
        trend: value > (prevMuscleMap[name] || 0) ? 'up' : value < (prevMuscleMap[name] || 0) ? 'down' : 'stable'
      }))
      .filter(m => m.value > 0 || totalVolume === 0)
      .sort((a, b) => b.value - a.value);

    // Lógica mejorada: Músculo descuidado
    let neglectedMuscle = ALL_MUSCLE_GROUPS.find(g => (muscleMap[g] || 0) === 0) || 
                          ALL_MUSCLE_GROUPS.sort((a, b) => (muscleMap[a] || 0) - (muscleMap[b] || 0))[0];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const currentMonthHistory = history.filter(h => new Date(h.date) >= startOfMonth);

    let monthlyPrCount = 0;
    currentMonthHistory.forEach(h => { if(h.volume > 0) monthlyPrCount += 1; });

    const exerciseMaxes: Record<string, number> = {};
    const prRecords: { name: string; weight: number; date: string; timestamp: number }[] = [];
    const chronologicalHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    chronologicalHistory.forEach(session => {
      session.exercises?.forEach((ex: any) => {
        const maxInSession = Math.max(...(ex.sets || []).filter((s:any) => s.completed).map((s: any) => Number(s.weight) || 0), 0);
        const prevMax = exerciseMaxes[ex.exerciseId] || 0;
        
        if (maxInSession > prevMax && maxInSession > 0) {
          exerciseMaxes[ex.exerciseId] = maxInSession;
          prRecords.push({
            name: ex.name,
            weight: maxInSession,
            date: new Date(session.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            timestamp: new Date(session.date).getTime()
          });
        }
      });
    });

    const recentPrs = prRecords.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);

    const uniqueDates = Array.from(new Set(history.map(h => new Date(h.date).toDateString())))
      .map((d: string) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    if (uniqueDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const latestDate = uniqueDates[0];
      latestDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        streak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const current = uniqueDates[i];
          const next = uniqueDates[i + 1];
          const gap = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
          if (gap === 1) streak++; else break;
        }
      }
    }

    return { totalVolume, prevWeekVolume, muscleDist, neglectedMuscle, recentPrs, sessionsCount: historyWeek.length, monthlyPrCount, streak };
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
      unit: 'objetivos cumplidos',
      icon: 'stars',
      color: '#60a5fa'
    });

    goalsList.push({
      id: 'volume' as GoalType,
      label: 'Carga Semanal',
      current: stats.totalVolume,
      target: userProfile.goalSettings.targetVolumePerWeek,
      progress: Math.min(100, Math.round((stats.totalVolume / userProfile.goalSettings.targetVolumePerWeek) * 100)),
      unit: userProfile.weightUnit,
      icon: 'fitness_center',
      color: '#c084fc'
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

  const currentAvatar = avatarUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop';

  return (
    <div className="pb-64 bg-background-light dark:bg-background-dark min-h-full transition-all relative">
      <div className="pt-[max(1.5rem,env(safe-area-inset-top))] px-6 pb-2">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
             <div className="relative group active:scale-95 transition-all">
               <button 
                  onClick={() => setShowFullImage(true)}
                  className={`size-16 rounded-full animate-profile-ring p-1 shadow-xl bg-white dark:bg-zinc-800 transition-all duration-500 overflow-hidden ${displayMode === 'greeting' ? 'scale-110' : 'scale-100'}`}
                >
                 <div className="w-full h-full rounded-full border-2 border-white dark:border-zinc-800 bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url("${currentAvatar}")` }}></div>
               </button>
               <div className="absolute -bottom-1 -right-1 size-6 bg-black dark:bg-white rounded-full flex items-center justify-center border-2 border-background-light dark:border-background-dark shadow-lg pointer-events-none">
                 <span className="material-symbols-outlined text-[14px] text-primary dark:text-black font-black">bolt</span>
               </div>
             </div>
             <div className="flex flex-col min-w-0">
                <div className="relative h-8 flex items-end">
                  <h2 className={`absolute left-0 text-3xl font-black tracking-tighter leading-none whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${displayMode === 'alias' ? 'opacity-100 scale-100 blur-0 translate-y-0' : 'opacity-0 scale-95 blur-sm translate-y-1 pointer-events-none'}`}>
                    {userAlias || 'Atleta'}
                  </h2>
                  <h2 className={`absolute left-0 text-3xl font-black tracking-tighter leading-none whitespace-nowrap text-primary-text dark:text-primary transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${displayMode === 'greeting' ? 'opacity-100 scale-100 blur-0 translate-y-0' : 'opacity-0 scale-95 blur-sm translate-y-1 pointer-events-none'}`}>
                    {timeGreeting}
                  </h2>
                </div>
                <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.22em] mt-0.5 ml-0.5 opacity-80 whitespace-nowrap leading-none">Resumen de Atleta</p>
             </div>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className={`size-14 rounded-2xl shadow-xl border flex items-center justify-center transition-all active:scale-90 shrink-0 ${isEditing ? 'bg-primary text-black border-primary' : 'bg-white dark:bg-surface-dark text-slate-400 border-black/5'}`}>
            <span className="material-symbols-outlined text-3xl font-black">{isEditing ? 'done' : 'tune'}</span>
          </button>
        </div>
      </div>

      <div className="px-6 mb-8">
        <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-6 shadow-sm border border-black/5 flex items-center justify-around">
           <button onClick={() => onNavigateToStats?.()} className="flex flex-col items-center gap-1 group">
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-orange-500 font-black text-xl">local_fire_department</span><span className="text-xl font-black tabular-nums">{stats.streak} Días</span></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-active:text-primary">Racha</span>
           </button>
           <div className="w-px h-8 bg-black/5 dark:bg-white/5"></div>
           <button onClick={() => onNavigateToStats?.()} className="flex flex-col items-center gap-1 group">
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-blue-500 font-black text-xl">stars</span><span className="text-xl font-black tabular-nums">{stats.monthlyPrCount}</span></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-active:text-primary">Logros</span>
           </button>
           <div className="w-px h-8 bg-black/5 dark:bg-white/5"></div>
           <button onClick={() => setShowGoalPlanner(true)} className="flex flex-col items-center gap-1 group">
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-primary font-black text-xl">target</span><span className="text-xl font-black tabular-nums">{globalProgress}%</span></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-active:text-primary">Meta Global</span>
           </button>
        </div>
      </div>

      <div className="px-5 space-y-12 transition-all duration-500">
        {isEditing && (
          <div className="bg-primary/10 text-primary-text dark:text-white p-6 rounded-[2.5rem] mb-4 animate-in fade-in flex items-center gap-4 border border-primary/20">
            <span className="material-symbols-outlined text-primary font-black text-3xl">dashboard_customize</span>
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Personaliza tu dashboard. Arrastra para ordenar u oculta widgets.</p>
          </div>
        )}

        {widgets.map((widget, index) => {
          if (!widget || (!widget.visible && !isEditing)) return null;
          return (
            <div key={widget.id} className={`relative transition-all duration-300 ${isEditing && !widget.visible ? 'opacity-30 scale-95 grayscale blur-[1px]' : 'opacity-100 scale-100'}`}>
              {isEditing && (
                <div className="absolute -top-6 left-0 right-0 z-[60] flex items-center justify-between px-2 pointer-events-none translate-y-[-50%]">
                  <div className="flex items-center gap-1.5 bg-black dark:bg-zinc-800 p-1.5 rounded-2xl shadow-2xl border border-white/10 pointer-events-auto">
                    <button onClick={() => handleReorder(index, index - 1)} disabled={index === 0} className="size-11 flex items-center justify-center rounded-xl active:bg-primary disabled:opacity-20 text-white"><span className="material-symbols-outlined text-2xl font-black">keyboard_arrow_up</span></button>
                    <button onClick={() => handleReorder(index, index + 1)} disabled={index === widgets.length - 1} className="size-11 flex items-center justify-center rounded-xl active:bg-primary disabled:opacity-20 text-white"><span className="material-symbols-outlined text-2xl font-black">keyboard_arrow_down</span></button>
                  </div>
                  <div className="pointer-events-auto">
                    <button onClick={() => toggleWidget(widget.id)} className={`size-14 rounded-2xl shadow-2xl border-2 flex items-center justify-center transition-all active:scale-95 ${widget.visible ? 'bg-primary text-black border-primary' : 'bg-white dark:bg-surface-dark text-slate-400 border-black/5'}`}><span className="material-symbols-outlined text-2xl font-black">{widget.visible ? 'visibility' : 'visibility_off'}</span></button>
                  </div>
                </div>
              )}
              <WidgetContent 
                id={widget.id} 
                stats={stats} 
                dynamicGoals={dynamicGoals} 
                chartData={chartData}
                userProfile={userProfile}
                onAdjustGoal={() => setShowGoalPlanner(true)}
                onShowVolumeDetail={() => setShowVolumeDetail(true)}
                onShowFatigueDetail={() => setShowFatigueDetail(true)}
                onShowHelp={(metric) => setActiveHelp(metric)}
                onViewStats={onNavigateToStats}
                onStartWorkout={onStartWorkout}
                onStartDirectWorkout={onStartDirectWorkout}
              />
            </div>
          );
        })}
      </div>

      {!isEditing && (
        <div className={`fixed left-0 right-0 px-8 z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isFooterVisible ? 'bottom-[calc(112px+env(safe-area-inset-bottom))] opacity-100 translate-y-0' : 'bottom-[calc(32px+env(safe-area-inset-bottom))] opacity-80 translate-y-4'}`}>
          <button onClick={onStartWorkout} className="w-full h-24 bg-primary text-black font-black text-2xl rounded-full shadow-xl flex items-center justify-center gap-5 active:scale-[0.97] group">
            <div className="size-12 bg-black text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg"><span className="material-symbols-outlined text-3xl fill-1 font-black">play_arrow</span></div>
            ENTRENAR AHORA
          </button>
        </div>
      )}

      {/* FULL SCREEN IMAGE MODAL - ZOOM EFFECT */}
      {showFullImage && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300">
          {/* Backdrop con desenfoque extremo */}
          <div 
            onClick={() => setShowFullImage(false)} 
            className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
          ></div>
          
          <button 
            onClick={() => setShowFullImage(false)} 
            className="absolute top-[calc(env(safe-area-inset-top)+1rem)] right-6 size-12 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-90 transition-all z-[260]"
          >
            <span className="material-symbols-outlined font-black text-2xl">close</span>
          </button>

          <div className="relative z-[255] w-full max-w-sm flex flex-col items-center animate-in zoom-in-50 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="w-full aspect-square rounded-[3.5rem] animate-profile-ring p-1.5 shadow-[0_0_120px_rgba(96,165,250,0.4)] overflow-hidden mb-10">
              <div 
                className="w-full h-full rounded-[3.1rem] bg-cover bg-center border-[12px] border-black/40" 
                style={{ backgroundImage: `url("${currentAvatar}")` }}
              ></div>
            </div>
            
            <div className="text-center space-y-3 animate-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-primary font-black text-3xl">verified</span>
                <h4 className="text-white font-black text-4xl tracking-tighter uppercase">{userAlias || 'Atleta'}</h4>
              </div>
              <p className="text-slate-400 font-black text-[12px] uppercase tracking-[0.4em]">Status: Élite Pro</p>
              
              <div className="pt-8 flex gap-4">
                <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Racha</span>
                  <span className="text-2xl font-black text-orange-500">{stats.streak}D</span>
                </div>
                <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Carga</span>
                  <span className="text-2xl font-black text-blue-400">{stats.totalVolume.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeHelp && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div onClick={() => setActiveHelp(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-xs bg-white dark:bg-surface-dark rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6"><span className="material-symbols-outlined text-4xl font-black">help</span></div>
            <h3 className="text-xl font-black tracking-tight mb-4">{METRIC_HELP[activeHelp].title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">{METRIC_HELP[activeHelp].content}</p>
            <button onClick={() => setActiveHelp(null)} className="w-full py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest shadow-xl">Entendido</button>
          </div>
        </div>
      )}

      {showVolumeDetail && userProfile && (
        <VolumeDetailModal 
          chartData={chartData} 
          totalVolume={stats.totalVolume} 
          prevVolume={stats.prevWeekVolume} 
          userProfile={userProfile}
          onClose={() => setShowVolumeDetail(false)} 
        />
      )}
      
      {showFatigueDetail && <FatigueDetailModal onClose={() => setShowFatigueDetail(false)} />}
      
      {showGoalPlanner && userProfile && (
        <GoalPlannerModal userProfile={userProfile} onClose={() => setShowGoalPlanner(false)} onSave={(newProfile) => {
          setUserProfile(newProfile);
          localStorage.setItem('gymProgress_user_profile', JSON.stringify(newProfile));
        }} />
      )}
    </div>
  );
};

const FatigueDetailModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [checklist, setChecklist] = useState({ sleep: false, nutrition: false, hydration: false, stretching: false });
  const [soreness, setSoreness] = useState(3);
  const [showSorenessHelp, setShowSorenessHelp] = useState(false);
  
  const acwrValue = 1.15; 
  
  const sorenessColor = useMemo(() => {
    if (soreness <= 3) return '#10b981';
    if (soreness <= 7) return '#f59e0b';
    return '#ef4444';
  }, [soreness]);

  const sorenessColorClass = useMemo(() => {
    if (soreness <= 3) return 'text-emerald-500';
    if (soreness <= 7) return 'text-amber-500';
    return 'text-red-500';
  }, [soreness]);

  const readinessScore = useMemo(() => {
    let score = 50;
    if (checklist.sleep) score += 15;
    if (checklist.nutrition) score += 10;
    if (checklist.hydration) score += 10;
    if (checklist.stretching) score += 5;
    score -= (soreness * 2);
    return Math.min(100, Math.max(0, score));
  }, [checklist, soreness]);

  const statusLabel = useMemo(() => {
    if (readinessScore > 85) return { 
      label: 'ELITE', 
      color: 'text-blue-500', 
      bg: 'bg-blue-600', 
      textColor: 'text-white' 
    };
    if (readinessScore > 65) return { 
      label: 'ÓPTIMO', 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500', 
      textColor: 'text-white' 
    };
    if (readinessScore > 40) return { 
      label: 'MODERADO', 
      color: 'text-amber-500', 
      bg: 'bg-amber-400', 
      textColor: 'text-black' 
    };
    return { 
      label: 'RIESGO', 
      color: 'text-red-500', 
      bg: 'bg-red-500', 
      textColor: 'text-white' 
    };
  }, [readinessScore]);

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-3xl flex items-end animate-in fade-in duration-300 p-4 pb-0">
      <div onClick={onClose} className="absolute inset-0"></div>
      <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] p-8 pb-16 shadow-2xl animate-in slide-in-from-bottom duration-500 relative flex flex-col max-h-[96vh] overflow-y-auto no-scrollbar">
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8 opacity-40"></div>
        
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h3 className="text-3xl font-black tracking-tighter leading-none">Centro de Salud</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Estado de Recuperación</p>
          </div>
          <button onClick={onClose} className="size-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-background-dark/50 rounded-[3rem] p-8 mb-8 border border-black/5 flex flex-col items-center">
           <div className="relative mb-6 flex flex-col items-center">
              <svg className="w-48 h-24" viewBox="0 0 100 50">
                 <path d="M 10 45 A 35 35 0 0 1 90 45" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                 <path 
                    d="M 10 45 A 35 35 0 0 1 90 45" 
                    fill="none" stroke={statusLabel.bg.replace('bg-', '#')} strokeWidth="8" strokeLinecap="round" 
                    strokeDasharray="125.6" 
                    strokeDashoffset={125.6 - (125.6 * (acwrValue / 2))}
                    className="transition-all duration-1000"
                 />
              </svg>
              <div className="absolute bottom-0 text-center">
                 <p className="text-4xl font-black tabular-nums tracking-tighter">{acwrValue}</p>
                 <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest -mt-1">Ratio ACWR</p>
              </div>
           </div>
           <div className={`px-4 py-1.5 rounded-full border-2 ${statusLabel.color} border-current font-black text-[10px] uppercase tracking-widest animate-pulse`}>
              Estado: {statusLabel.label}
           </div>
        </div>

        <div className="space-y-6 mb-8">
           <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2">Checklist de Hoy</h4>
           <div className="grid grid-cols-2 gap-4">
              <CheckItem 
                icon="bedtime" label="Sueño 7h+" active={checklist.sleep} 
                onClick={() => setChecklist({...checklist, sleep: !checklist.sleep})} 
              />
              <CheckItem 
                icon="restaurant" label="Proteína OK" active={checklist.nutrition} 
                onClick={() => setChecklist({...checklist, nutrition: !checklist.nutrition})} 
              />
              <CheckItem 
                icon="water_drop" label="Hidratación" active={checklist.hydration} 
                onClick={() => setChecklist({...checklist, hydration: !checklist.hydration})} 
              />
              <CheckItem 
                icon="self_improvement" label="Movilidad" active={checklist.stretching} 
                onClick={() => setChecklist({...checklist, stretching: !checklist.stretching})} 
              />
           </div>
        </div>

        <div className="bg-slate-50 dark:bg-background-dark/50 p-8 rounded-[3rem] mb-10 border border-black/5 flex flex-col items-center">
           <div className="flex items-center justify-center gap-2 mb-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Nivel de Agujetas</h4>
              <button 
                onClick={() => setShowSorenessHelp(!showSorenessHelp)}
                className={`size-6 flex items-center justify-center rounded-full transition-all active:scale-75 ${showSorenessHelp ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}
              >
                <span className="material-symbols-outlined text-[16px] font-bold">help</span>
              </button>
           </div>

           {showSorenessHelp && (
              <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-emerald-500/20 shadow-sm mb-6 animate-in slide-in-from-top-2">
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic text-center">
                  Indica el dolor muscular residual. Evalúa cuánto te molesta mover o presionar el músculo trabajado anteriormente.
                </p>
              </div>
           )}

           <span className={`text-5xl font-black tabular-nums tracking-tighter transition-colors duration-300 ${sorenessColorClass}`}>
             {soreness}<span className="text-lg text-slate-300">/10</span>
           </span>

           <div className="w-full px-4 mt-6">
              <input 
                  type="range" min="1" max="10" value={soreness} 
                  onChange={(e) => setSoreness(parseInt(e.target.value))}
                  style={{ accentColor: sorenessColor } as any}
                  className="w-full h-4 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer" 
              />
              <div className="flex justify-between mt-3 px-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <span className={soreness <= 3 ? 'text-emerald-500' : ''}>Fresco</span>
                  <span className={soreness >= 8 ? 'text-red-500' : ''}>Dolorido</span>
              </div>
           </div>
        </div>

        <div className={`p-10 rounded-[4rem] mb-12 shadow-2xl flex items-center justify-between overflow-hidden relative mx-2 min-h-[140px] transition-all duration-500 ${statusLabel.bg} ${statusLabel.textColor}`}>
           <div className={`absolute top-0 left-0 h-full opacity-30 transition-all duration-1000 bg-white/40`} style={{ width: `${readinessScore}%` }}></div>
           <div className="relative z-10 flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-70 mb-1">Ready Score</p>
              <p className="text-6xl font-black tabular-nums tracking-tighter leading-none">{readinessScore}%</p>
           </div>
           <div className="relative z-10 text-right ml-4">
              <p className="text-sm font-black leading-tight max-w-[150px] uppercase italic">
                {readinessScore > 70 ? 'Cuerpo en estado óptimo. Máxima intensidad.' : 'Fatiga detectada. Considera una descarga técnica.'}
              </p>
           </div>
        </div>

        <div className="px-10 pb-6">
          <button 
            onClick={onClose}
            className={`w-full min-h-[85px] rounded-full text-white font-black text-xl active:scale-[0.97] transition-all shadow-2xl uppercase tracking-[0.25em] flex items-center justify-center gap-3 border-4 border-white/20 ${statusLabel.bg}`}
          >
            <span className="material-symbols-outlined font-black text-3xl">offline_bolt</span>
            LISTO PARA ENTRENAR
          </button>
        </div>
      </div>
    </div>
  );
};

const CheckItem: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-95 text-left h-20 ${active ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-surface-dark border-black/5 text-slate-400'}`}
  >
    <span className={`material-symbols-outlined text-xl ${active ? 'fill-1' : ''}`}>{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-tighter leading-tight">{label}</span>
  </button>
);

const VolumeDetailModal: React.FC<{ chartData: any[], totalVolume: number, prevVolume: number, userProfile: UserProfile, onClose: () => void }> = ({ chartData, totalVolume, prevVolume, userProfile, onClose }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const trend = useMemo(() => {
    if (prevVolume === 0) return { percent: totalVolume > 0 ? 100 : 0, up: true };
    const diff = ((totalVolume - prevVolume) / prevVolume) * 100;
    return { percent: Math.round(diff), up: diff >= 0 };
  }, [totalVolume, prevVolume]);

  const insight = useMemo(() => {
    const p = trend.percent;
    if (p > 15) return { message: "¡Sobrecarga explosiva! Estás ganando fuerza rápido." };
    if (p >= 5) return { message: "Progreso constante. Mantén este ritmo." };
    if (p > -5) return { message: "Fase de consolidación. La base es sólida." };
    return { message: "Descarga detectada. Escucha a tu cuerpo." };
  }, [trend]);

  const fetchAiInsight = async () => {
    setLoadingAi(true);
    try {
      const advice = await getVolumeInsight(totalVolume, prevVolume, userProfile);
      setAiInsight(advice);
    } catch (e) {
      setAiInsight("No pude conectar con el entrenador IA. Sigue priorizando la técnica.");
    }
    setLoadingAi(false);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-3xl flex items-end animate-in fade-in duration-300">
      <div onClick={onClose} className="absolute inset-0"></div>
      
      <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 relative overflow-hidden">
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-6 mb-2 opacity-40"></div>
        
        <div className="flex items-center justify-between px-8 py-6">
          <div>
            <h3 className="text-3xl font-black tracking-tighter">Análisis de Carga</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Rendimiento Semanal</p>
          </div>
          <button onClick={onClose} className="size-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-4xl font-black">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-56 space-y-10">
          <div className="bg-slate-50 dark:bg-background-dark/50 rounded-[3rem] p-8 border border-black/5 flex flex-col items-center">
             <div className="relative mb-6">
                <div className={`size-48 rounded-full border-[12px] flex flex-col items-center justify-center bg-white dark:bg-surface-dark shadow-xl ${trend.up ? 'border-primary' : 'border-red-500'}`}>
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Tendencia</span>
                   <span className="text-6xl font-black tabular-nums tracking-tighter">+{trend.percent}%</span>
                   <span className={`material-symbols-outlined text-4xl font-black ${trend.up ? 'text-primary' : 'text-red-500'}`}>{trend.up ? 'trending_up' : 'trending_down'}</span>
                </div>
             </div>
             <p className="text-center text-xl font-medium leading-relaxed italic text-slate-700 dark:text-slate-300 px-4">
               {insight.message}
             </p>
          </div>

          <div className="h-64 w-full bg-slate-50 dark:bg-background-dark/50 rounded-[2.5rem] p-6 border border-black/5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFEF0A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFEF0A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '900', fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{ stroke: '#FFEF0A', strokeWidth: 2 }} 
                    content={({ active, payload }) => (active && payload ? <div className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black shadow-2xl">{payload[0].value} kg</div> : null)} 
                  />
                  <Area type="monotone" dataKey="volume" stroke="#FFEF0A" strokeWidth={5} fill="url(#colorVol)" dot={{r: 4, fill: '#FFEF0A', strokeWidth: 2, stroke: '#fff'}} />
                </AreaChart>
              </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-background-dark/50 border border-black/5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Esta Semana</p>
                <p className="text-2xl font-black tabular-nums">{totalVolume.toLocaleString()} <span className="text-xs opacity-40">kg</span></p>
             </div>
             <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-background-dark/50 border border-black/5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Anterior</p>
                <p className="text-2xl font-black tabular-nums">{prevVolume.toLocaleString()} <span className="text-xs opacity-40">kg</span></p>
             </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={fetchAiInsight}
              disabled={loadingAi}
              className="w-full flex items-center justify-center gap-3 py-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl relative overflow-hidden group"
            >
              {loadingAi && <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>}
              <span className="material-symbols-outlined font-black">psychology</span>
              {loadingAi ? 'Analizando carga...' : 'Análisis IA'}
            </button>

            {aiInsight && (
              <div className="p-8 rounded-[3rem] bg-gradient-to-br from-primary/5 to-orange-400/5 border-2 border-primary/20 animate-in fade-in">
                <p className="text base font-bold leading-relaxed text-slate-800 dark:text-slate-200">
                  {aiInsight}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white dark:from-surface-dark via-white dark:via-surface-dark to-transparent pt-16">
          <button 
            onClick={onClose} 
            className="w-full h-28 bg-primary text-black font-black text-2xl rounded-full shadow-lg active:scale-[0.96] transition-all uppercase tracking-[0.25em]"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};

const GoalPlannerModal: React.FC<{ userProfile: UserProfile, onClose: () => void, onSave: (p: UserProfile) => void }> = ({ userProfile, onClose, onSave }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>({ ...userProfile });
  const [activeTab, setActiveTab] = useState<GoalType>('sessions');
  const [showVolumeHelp, setShowVolumeHelp] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const toggleGoalVisibility = (type: GoalType) => {
    const current = localProfile.goalSettings.activeGoals;
    const next = current.includes(type) ? current.filter(g => g !== type) : [...current, type];
    setLocalProfile({ ...localProfile, goalSettings: { ...localProfile.goalSettings, activeGoals: next } });
  };

  // Valor actual basado en la pestaña activa
  const currentValue = useMemo(() => {
    if (activeTab === 'sessions') return localProfile.goalSettings.targetSessionsPerMonth;
    if (activeTab === 'prs') return localProfile.goalSettings.targetPRsPerMonth;
    return localProfile.goalSettings.targetVolumePerWeek;
  }, [activeTab, localProfile]);

  const updateTargetValue = (newValue: number) => {
    const settings = { ...localProfile.goalSettings };
    const val = Math.max(0, newValue);
    if (activeTab === 'sessions') settings.targetSessionsPerMonth = Math.round(val);
    if (activeTab === 'prs') settings.targetPRsPerMonth = Math.round(val);
    if (activeTab === 'volume') settings.targetVolumePerWeek = val;
    setLocalProfile({ ...localProfile, goalSettings: settings });
  };

  const fetchAiAdvice = async () => {
    setAiLoading(true);
    setAiAdvice(null);
    try {
      const advice = await getTargetVolumeRecommendation(localProfile);
      setAiAdvice(advice);
    } catch (e) {
      setAiAdvice(`Basado en tu peso de ${localProfile.weight}${localProfile.weightUnit} y meta de ${localProfile.goal}, te recomiendo configurar tu meta en ${(localProfile.weight * 200).toLocaleString()} kg para un progreso sólido.`);
    }
    setAiLoading(false);
  };

  const tabConfigs = {
    sessions: { label: 'Entrenos', icon: 'calendar_today', unit: 'Sesiones/mes', step: 1 },
    prs: { label: 'Récords', icon: 'stars', unit: 'Logros/mes', step: 1 },
    volume: { label: 'Volumen', icon: 'fitness_center', unit: `${localProfile.weightUnit}/sem`, step: 500 }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-2xl flex items-end animate-in fade-in duration-300 overflow-hidden">
      <div onClick={onClose} className="absolute inset-0"></div>
      <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-500 relative max-h-[96dvh] overflow-hidden">
        
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-6 mb-2 opacity-40 shrink-0"></div>
        
        <div className="flex items-center justify-between px-10 py-6 shrink-0">
          <h3 className="text-3xl font-black tracking-tighter leading-none">Mis Objetivos</h3>
          <button 
            onClick={onClose}
            className="size-11 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined font-black">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-40 space-y-8">
          
          <div className="bg-slate-100 dark:bg-background-dark p-1.5 rounded-[2.5rem] flex gap-1 shadow-inner">
            {(['sessions', 'prs', 'volume'] as GoalType[]).map(type => (
              <button 
                key={type} 
                onClick={() => { setActiveTab(type); setShowVolumeHelp(false); setAiAdvice(null); }} 
                className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-[2rem] transition-all duration-300 active:scale-95 ${activeTab === type ? 'bg-white dark:bg-surface-dark shadow-lg scale-[1.02] text-primary-text dark:text-primary' : 'text-slate-400'}`}
              >
                <span className={`material-symbols-outlined text-2xl ${activeTab === type ? 'fill-1' : ''}`}>{tabConfigs[type].icon}</span>
                <span className="text-[9px] font-black uppercase tracking-widest">{tabConfigs[type].label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500" key={activeTab}>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-background-dark/50 p-6 rounded-[2.5rem] border border-black/5">
              <div className="flex items-center gap-4">
                <div className={`size-12 rounded-xl flex items-center justify-center ${localProfile.goalSettings.activeGoals.includes(activeTab) ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                  <span className="material-symbols-outlined font-black">{tabConfigs[activeTab].icon}</span>
                </div>
                <div>
                  <p className="font-black text-lg leading-tight">{tabConfigs[activeTab].unit}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{localProfile.goalSettings.activeGoals.includes(activeTab) ? 'Visible en Panel' : 'Oculto'}</p>
                </div>
              </div>
              <button 
                onClick={() => toggleGoalVisibility(activeTab)} 
                className={`size-14 rounded-2xl flex items-center justify-center transition-all ${localProfile.goalSettings.activeGoals.includes(activeTab) ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}
              >
                <span className="material-symbols-outlined font-black text-2xl">{localProfile.goalSettings.activeGoals.includes(activeTab) ? 'check' : 'add'}</span>
              </button>
            </div>

            <div className="flex flex-col items-center gap-8 py-2 relative">
              <div className="flex items-center justify-center gap-5 w-full">
                <button 
                  onClick={() => updateTargetValue(currentValue - tabConfigs[activeTab].step)} 
                  className="size-16 rounded-full bg-slate-100 dark:bg-background-dark flex items-center justify-center active:scale-75 shadow-sm border border-black/5 text-slate-600 dark:text-slate-300"
                >
                  <span className="material-symbols-outlined text-3xl font-black">remove</span>
                </button>
                
                <div className="relative group flex-1 max-w-[200px]">
                  <input 
                    type="number" 
                    step={activeTab === 'volume' ? '0.1' : '1'}
                    value={currentValue}
                    onChange={(e) => updateTargetValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent border-0 text-[12vw] sm:text-6xl font-black tabular-nums tracking-tighter text-center focus:ring-0 p-0 leading-none outline-none appearance-none no-scrollbar"
                  />
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta {tabConfigs[activeTab].label}</span>
                    {activeTab === 'volume' && (
                      <button 
                        onClick={() => { setShowVolumeHelp(!showVolumeHelp); setAiAdvice(null); }}
                        className={`size-6 rounded-lg flex items-center justify-center transition-all ${showVolumeHelp ? 'bg-primary text-black shadow-lg' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}
                      >
                        <span className="material-symbols-outlined text-[16px] font-black">help</span>
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => updateTargetValue(currentValue + tabConfigs[activeTab].step)} 
                  className="size-16 rounded-full bg-slate-100 dark:bg-background-dark flex items-center justify-center active:scale-75 shadow-sm border border-black/5 text-slate-600 dark:text-slate-300"
                >
                  <span className="material-symbols-outlined text-3xl font-black">add</span>
                </button>
              </div>
              
              <div className={`overflow-hidden transition-all duration-500 ease-in-out w-full ${showVolumeHelp && activeTab === 'volume' ? 'max-h-[800px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="space-y-4">
                  {/* EXPLICACIÓN BÁSICA - NIVEL PRINCIPIANTE */}
                  <div className="bg-slate-50 dark:bg-background-dark/50 p-6 rounded-[2.5rem] border border-black/5 shadow-inner">
                     <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">lightbulb</span>
                       Explicación Sencilla
                     </h4>
                     <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">
                       Imagina que el volumen es tu "presupuesto semanal" de esfuerzo. <br/><br/>
                       Para ganar músculo, debes "pagar" con kilos levantados. <span className="text-primary-text dark:text-white font-black">Más kilos movidos con buena técnica = más ahorro en tu "banco de músculo".</span> Es la suma de (Peso × Reps × Series) de toda la semana.
                     </p>
                  </div>

                  {/* ASISTENTE IA - NIVEL PRO/CIENTÍFICO */}
                  <div className="bg-primary/5 p-6 rounded-[2.5rem] border-2 border-primary/20 shadow-sm space-y-4">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase text-primary-text dark:text-primary tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">psychology</span>
                          Asistente IA Pro
                        </h4>
                        {!aiAdvice && (
                          <button 
                            onClick={fetchAiAdvice}
                            disabled={aiLoading}
                            className="bg-primary text-black px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all disabled:opacity-50 shadow-md"
                          >
                            {aiLoading ? 'Calculando...' : 'Recomendación PhD'}
                          </button>
                        )}
                     </div>
                     
                     {aiAdvice ? (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                          <div className="bg-white/40 dark:bg-black/20 p-4 rounded-2xl border-l-4 border-primary">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                              {aiAdvice}
                            </p>
                          </div>
                          <button onClick={() => setAiAdvice(null)} className="mt-4 text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            Recalcular consulta
                          </button>
                        </div>
                     ) : (
                        <p className="text-[10px] font-bold text-slate-400 leading-tight">
                          Analizaré tus {localProfile.weight}kg, tu meta de {localProfile.goal} y tu edad para darte un rango de carga científicamente óptimo para TI.
                        </p>
                     )}
                  </div>
                </div>
              </div>

              {!showVolumeHelp && (
                <div className="bg-slate-50 dark:bg-background-dark/30 p-6 rounded-[2.5rem] border border-black/5 w-full text-center animate-in fade-in">
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed max-w-[240px] mx-auto italic">
                    {activeTab === 'sessions' ? 'La consistencia es la base. 12 sesiones al mes es el estándar de oro para ver cambios reales.' : 
                     activeTab === 'prs' ? 'Superar tus marcas personales es el motor real de la sobrecarga progresiva.' : 
                     'Aumentar el volumen total semana a semana asegura un estrés metabólico óptimo para crecer.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white dark:from-surface-dark via-white dark:via-surface-dark to-transparent pt-12 shrink-0">
          <button 
            onClick={() => { onSave(localProfile); onClose(); }} 
            className="w-full h-24 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-xl shadow-2xl uppercase tracking-[0.2em] active:scale-[0.97] transition-all pb-[env(safe-area-inset-bottom)]"
          >
            GUARDAR CAMBIOS
          </button>
        </div>
      </div>
    </div>
  );
};

const WidgetContent: React.FC<{ 
  id: string; 
  stats: any; 
  dynamicGoals: any[]; 
  chartData: any; 
  userProfile: UserProfile | null;
  onAdjustGoal: () => void;
  onShowVolumeDetail: () => void;
  onShowFatigueDetail: () => void;
  onShowHelp: (metric: keyof typeof METRIC_HELP) => void;
  onViewStats?: () => void;
  onStartWorkout?: () => void;
  onStartDirectWorkout?: (routine: CustomRoutine) => void;
}> = ({ id, stats, dynamicGoals, chartData, userProfile, onAdjustGoal, onShowVolumeDetail, onShowFatigueDetail, onShowHelp, onViewStats, onStartWorkout, onStartDirectWorkout }) => {
  const [activeGoalIdx, setActiveGoalIdx] = useState(0);
  const [isMuscleExpanded, setIsMuscleExpanded] = useState(false);

  useEffect(() => {
    if (activeGoalIdx >= dynamicGoals.length && dynamicGoals.length > 0) setActiveGoalIdx(0);
  }, [dynamicGoals.length]);

  const muscleSuggestion = useMemo(() => {
    if (stats.totalVolume === 0) return "Aún no hay registros esta semana. ¡Empieza una rutina para ver tu balance!";
    
    const topMuscle = stats.muscleDist[0];
    const neglected = stats.neglectedMuscle;
    
    if (topMuscle && topMuscle.percent > 45) {
      return `Dominancia crítica en ${topMuscle.name.toUpperCase()} (${topMuscle.percent}%). Considera priorizar ${neglected.toUpperCase()} para prevenir desequilibrios posturales.`;
    }
    
    if (neglected) {
      return `Tu enfoque en ${topMuscle?.name || 'músculo'} es sólido. No olvides dar amor a ${neglected.toUpperCase()} esta semana para un físico compensado.`;
    }
    
    return "Distribución equilibrada detectada. Mantén la variedad en tus patrones de movimiento.";
  }, [stats.muscleDist, stats.neglectedMuscle, stats.totalVolume]);

  switch (id) {
    case 'goal':
      const currentGoal = dynamicGoals[activeGoalIdx] || dynamicGoals[0];
      if (!currentGoal) return <div className="bg-black dark:bg-zinc-900 rounded-[4rem] p-12 text-white min-h-[460px] flex flex-col items-center justify-center gap-6 text-center"><span className="material-symbols-outlined text-6xl text-slate-700">ads_click</span><h3 className="text-2xl font-black">Sin Metas</h3><button onClick={onAdjustGoal} className="px-10 py-4 bg-primary text-black rounded-full text-xs font-black uppercase tracking-widest">Configurar</button></div>;
      return (
        <div className="relative rounded-[4rem] p-10 text-white min-h-[460px] flex flex-col items-center justify-center gap-8 shadow-sm border border-white/5 overflow-hidden transition-all duration-1000 bg-black dark:bg-zinc-900">
          <div className="relative size-60 shrink-0 flex items-center justify-center cursor-pointer select-none group active:scale-95 transition-all duration-300" onClick={() => setActiveGoalIdx((prev) => (prev + 1) % dynamicGoals.length)}>
            <svg className="size-full transform -rotate-90 absolute top-0 left-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.06)" strokeWidth="7" fill="transparent" />
              <circle cx="50" cy="50" r="44" stroke={currentGoal.color} strokeWidth="7" fill="transparent" strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * currentGoal.progress) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"/>
            </svg>
            <div className="flex flex-col items-center justify-center z-10 animate-in zoom-in-95 duration-500" key={currentGoal.id}>
              <div className="relative mb-2"><span className="material-symbols-outlined text-4xl" style={{ color: currentGoal.color }}>{currentGoal.icon}</span></div>
              <span className="text-7xl font-black tabular-nums tracking-tighter leading-none">{currentGoal.progress}%</span>
            </div>
          </div>
          <div className="text-center z-10 animate-in fade-in slide-in-from-bottom-2 duration-700" key={currentGoal.label}>
            <h3 className="text-3xl font-black tracking-tight mb-2 text-white/95">{currentGoal.label}</h3>
            <p className="text-slate-400 text-base font-bold tracking-tight">{currentGoal.current.toLocaleString()} <span className="text-xs uppercase opacity-60">de</span> {currentGoal.target.toLocaleString()} <span className="text-xs uppercase opacity-60">{currentGoal.unit}</span></p>
            <div className="justify-center gap-3 mt-10 flex items-center">{dynamicGoals.map((_, i) => (<button key={i} onClick={(e) => { e.stopPropagation(); setActiveGoalIdx(i); }} className={`h-2 rounded-full transition-all duration-500 ${activeGoalIdx === i ? 'w-10 bg-current' : 'w-2 bg-white/10 hover:bg-white/20'}`} style={{ color: currentGoal.color }}/>))}</div>
          </div>
          <div className="absolute bottom-6 flex items-center gap-2 opacity-20 group-hover:opacity-50 transition-opacity"><span className="material-symbols-outlined text-xs">touch_app</span><span className="text-[8px] font-black uppercase tracking-[0.3em]">Tocar para rotar</span></div>
        </div>
      );
    case 'quick_stats':
      return (
        <div className="grid grid-cols-2 gap-5 animate-in fade-in min-h-0">
          <button onClick={() => onViewStats?.()} className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-8 border border-black/5 shadow-xl flex flex-col justify-center aspect-square text-left active:scale-95 transition-all">
             <div className="size-16 rounded-2xl bg-orange-100 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mb-6 shadow-inner"><span className="material-symbols-outlined font-black text-4xl">local_fire_department</span></div>
             <MetricLabelHelp label="Racha" metric="racha" onShowHelp={onShowHelp} />
             <p className="text-4xl font-black tabular-nums mt-1 tracking-tighter">{stats.streak} Días</p>
          </button>
          <button onClick={() => onViewStats?.()} className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-8 border border-black/5 shadow-xl flex flex-col justify-center aspect-square text-left active:scale-95 transition-all">
             <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center mb-6 shadow-inner"><span className="material-symbols-outlined font-black text-4xl">calendar_month</span></div>
             <MetricLabelHelp label="Sesiones" metric="sesiones" onShowHelp={onShowHelp} />
             <p className="text-4xl font-black tabular-nums mt-1 tracking-tighter">{stats.sessionsCount}/sem</p>
          </button>
        </div>
      );
    case 'volume_chart':
      return (
        <div className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-10 shadow-xl border border-black/5 animate-in fade-in relative min-h-0">
          <div className="flex justify-between items-start mb-10">
            <div><MetricLabelHelp label="Volumen Semanal" metric="volumen" onShowHelp={onShowHelp} /><h4 className="text-5xl font-black tracking-tighter tabular-nums leading-none mt-1">{stats.totalVolume.toLocaleString()} <span className="text-lg text-slate-300 font-black ml-1">kg</span></h4></div>
            <button onClick={onShowVolumeDetail} className="size-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl hover:rotate-12 transition-all"><span className="material-symbols-outlined text-2xl font-black">query_stats</span></button>
          </div>
          <div className="h-56 w-full cursor-pointer" onClick={onShowVolumeDetail}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="volume" radius={[14, 14, 14, 14]} barSize={40}>
                  {chartData.map((entry: any, idx: number) => <Cell key={`c-${idx}`} fill={entry.isReal ? '#FFEF0A' : '#f1f5f9'} />)}
                </Bar>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: '900', fill: '#94a3b8'}} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    case 'fatigue_risk':
      return (
        <button onClick={onShowFatigueDetail} className="w-full bg-white dark:bg-surface-dark rounded-[4rem] p-10 border border-black/5 flex items-center justify-between animate-in fade-in shadow-xl text-left active:scale-95 transition-all">
          <div className="flex items-center gap-8">
            <div className="size-20 rounded-[2.2rem] bg-green-500/10 flex items-center justify-center text-green-500 shadow-inner"><span className="material-symbols-outlined text-4xl font-black animate-pulse">ecg_heart</span></div>
            <div><h4 className="font-black text-2xl tracking-tighter leading-none">Zona Óptima</h4><p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-2">Centro de Recuperación</p></div>
          </div>
          <span className="material-symbols-outlined text-slate-200 text-4xl font-black">chevron_right</span>
        </button>
      );
    case 'muscle_dist':
      return (
        <div className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-10 border border-black/5 animate-in fade-in shadow-xl min-h-0 relative group">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.25em]">Foco Muscular</h4>
            <button 
              onClick={() => setIsMuscleExpanded(!isMuscleExpanded)}
              className="size-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center active:scale-90 transition-all border border-black/5"
            >
              <span className="material-symbols-outlined text-slate-400 text-xl font-black">{isMuscleExpanded ? 'close_fullscreen' : 'open_in_full'}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-10 mb-8">
            <div className="size-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.muscleDist.length > 0 ? stats.muscleDist : [{value: 1}]} innerRadius={40} outerRadius={65} paddingAngle={8} dataKey="value" stroke="none">{stats.muscleDist.map((_: any, i: number) => <Cell key={i} fill={['#FFEF0A', '#E6D709', '#CCBF08', '#B3A707', '#998F06'][i % 5]} />)}{stats.muscleDist.length === 0 && <Cell fill="#f1f5f9" />}</Pie></PieChart></ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-5 min-w-0">
              {stats.muscleDist.slice(0, isMuscleExpanded ? 8 : 3).map((item: any) => (
                <div key={item.name} className="flex flex-col gap-1.5 group/item">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5 truncate">
                       <span className="text-slate-400 truncate">{item.name}</span>
                       <span className={`material-symbols-outlined text-[12px] font-black ${item.trend === 'up' ? 'text-green-500' : item.trend === 'down' ? 'text-red-400' : 'text-slate-300'}`}>
                         {item.trend === 'up' ? 'trending_up' : item.trend === 'down' ? 'trending_down' : 'remove'}
                       </span>
                    </div>
                    <span className="text-slate-950 dark:text-white font-black">{item.percent}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${item.percent}%` }}></div>
                  </div>
                  {stats.neglectedMuscle === item.name && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="size-1.5 rounded-full bg-orange-500 animate-ping"></span>
                      <span className="text-[7px] font-black text-orange-500 uppercase tracking-[0.15em]">Sugerencia: Priorizar</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-5 rounded-[2rem] bg-slate-50 dark:bg-background-dark/50 border border-black/5 flex items-center gap-4">
             <div className="size-12 rounded-xl bg-primary/20 text-primary-text flex items-center justify-center shrink-0"><span className="material-symbols-outlined font-black">psychology</span></div>
             <p className="text-[10px] font-bold text-slate-500 leading-tight">
                {muscleSuggestion}
             </p>
          </div>
        </div>
      );
    case 'recent_prs':
      return (
        <div className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-10 border border-black/5 animate-in fade-in shadow-xl min-h-0">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Últimos Hitos</h4>
            <span className="material-symbols-outlined text-primary text-2xl fill-1">stars</span>
          </div>
          <div className="space-y-6">
            {stats.recentPrs.length > 0 ? stats.recentPrs.map((pr: any, i: number) => (
              <div key={i} className="flex items-center gap-6 animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner">
                  <span className="material-symbols-outlined text-2xl font-black">bolt</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-lg truncate tracking-tight text-slate-900 dark:text-white leading-none">{pr.name}</p>
                    <p className="text-[9px] font-black text-primary bg-black dark:bg-white/10 px-2 py-0.5 rounded-md uppercase shrink-0 ml-2">{pr.date}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-400 mt-1.5 uppercase tracking-[0.15em]">{pr.weight} {userProfile?.weightUnit || 'kg'}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-slate-200 dark:text-white/5 text-5xl mb-3 block">military_tech</span>
                <p className="text-sm text-slate-400 font-bold italic tracking-wide px-4">¡Sigue entrenando para ver tus récords aquí!</p>
              </div>
            )}
          </div>
        </div>
      );
    default: return null;
  }
};

export default Dashboard;
