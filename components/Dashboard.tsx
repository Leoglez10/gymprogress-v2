
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid, AreaChart, Area, Tooltip } from 'recharts';
import { UserProfile, GoalType } from '../types';
import { getVolumeInsight } from '../services/geminiService';

interface DashboardProps {
  onStartWorkout: () => void;
  userAlias?: string;
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

const METRIC_HELP = {
  volumen: {
    title: "Volumen Semanal",
    content: "Es la suma total de kg movidos (Peso x Repeticiones x Series) en los últimos 7 días. Es la métrica reina para medir la sobrecarga progresiva."
  },
  racha: {
    title: "Racha de Entrenamiento",
    content: "Mide tu consistencia. Se mantiene activa siempre que entrenes dentro de tu frecuencia semanal objetivo."
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

const Dashboard: React.FC<DashboardProps> = ({ onStartWorkout, userAlias, goal, isFooterVisible = true }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showGoalPlanner, setShowGoalPlanner] = useState(false);
  const [showVolumeDetail, setShowVolumeDetail] = useState(false);
  const [showFatigueDetail, setShowFatigueDetail] = useState(false);
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
    const currentMonthHistory = history.filter(h => new Date(h.date) >= startOfMonth);

    let monthlyPrCount = 0;
    currentMonthHistory.forEach(h => { if(h.volume > 0) monthlyPrCount += 1; });

    const recentPrs: any[] = [];
    history.slice(-3).forEach(h => recentPrs.push({ name: 'Mejora en Volumen', weight: h.volume, date: h.date }));

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
      unit: 'objetivos cumplidos',
      icon: 'stars',
      color: '#60a5fa'
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

  return (
    <div className="pb-64 bg-background-light dark:bg-background-dark min-h-full transition-all relative">
      <div className="pt-[max(1.5rem,env(safe-area-inset-top))] px-6 pb-2">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
             <div className="relative group active:scale-95 transition-all">
               <div className="absolute -inset-1.5 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <div className={`size-16 rounded-full border-[3px] border-primary p-0.5 shadow-xl bg-white dark:bg-zinc-800 transition-all duration-500 ${displayMode === 'greeting' ? 'scale-110 shadow-primary/20' : 'scale-100'}`}>
                 <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop")' }}></div>
               </div>
               <div className="absolute -bottom-1 -right-1 size-6 bg-black dark:bg-white rounded-full flex items-center justify-center border-2 border-background-light dark:border-background-dark shadow-lg">
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
           <button onClick={() => setActiveHelp('racha')} className="flex flex-col items-center gap-1 group">
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-orange-500 font-black text-xl">local_fire_department</span><span className="text-xl font-black tabular-nums">5 Días</span></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-active:text-primary">Racha</span>
           </button>
           <div className="w-px h-8 bg-black/5 dark:bg-white/5"></div>
           <button onClick={() => setActiveHelp('prs')} className="flex flex-col items-center gap-1 group">
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-blue-500 font-black text-xl">stars</span><span className="text-xl font-black tabular-nums">{stats.monthlyPrCount}</span></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-active:text-primary">Logros</span>
           </button>
           <div className="w-px h-8 bg-black/5 dark:bg-white/5"></div>
           <button onClick={() => setActiveHelp('meta')} className="flex flex-col items-center gap-1 group">
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
                onAdjustGoal={() => setShowGoalPlanner(true)}
                onShowVolumeDetail={() => setShowVolumeDetail(true)}
                onShowFatigueDetail={() => setShowFatigueDetail(true)}
                onShowHelp={(metric) => setActiveHelp(metric as any)}
              />
            </div>
          );
        })}
      </div>

      {!isEditing && (
        <div className={`fixed left-0 right-0 px-8 z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isFooterVisible ? 'bottom-[calc(112px+env(safe-area-inset-bottom))] opacity-100 translate-y-0' : 'bottom-[calc(32px+env(safe-area-inset-bottom))] opacity-80 translate-y-4'}`}>
          <button onClick={onStartWorkout} className="w-full h-24 bg-primary text-black font-black text-2xl rounded-full shadow-[0_25px_50px_-12px_rgba(255,239,10,0.5)] flex items-center justify-center gap-5 active:scale-[0.97] group">
            <div className="size-12 bg-black text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg"><span className="material-symbols-outlined text-3xl fill-1 font-black">play_arrow</span></div>
            ENTRENAR AHORA
          </button>
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
  
  const acwrValue = 1.15; // Valor simulado
  
  // Lógica de color dinámica para las agujetas
  const sorenessColor = useMemo(() => {
    if (soreness <= 3) return '#10b981'; // Emerald 500
    if (soreness <= 7) return '#f59e0b'; // Amber 500
    return '#ef4444'; // Red 500
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

  // Lógica extendida para el Readiness Score con colores y contraste
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
          <button onClick={onClose} className="size-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 active:scale-90 transition-all" aria-label="Cerrar">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        {/* GAUGE DE ACWR VISUAL */}
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
           <div className="flex flex-col items-center gap-2 mb-6 w-full relative">
              <div className="flex items-center gap-2 justify-center">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Nivel de Agujetas</h4>
                <button 
                  onClick={() => setShowSorenessHelp(!showSorenessHelp)}
                  className={`size-6 flex items-center justify-center rounded-full transition-all active:scale-75 ${showSorenessHelp ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}
                  aria-label="Información sobre agujetas"
                >
                  <span className="material-symbols-outlined text-[16px] font-bold">{showSorenessHelp ? 'close' : 'help'}</span>
                </button>
              </div>

              <div className={`overflow-hidden transition-all duration-500 ease-in-out w-full px-2 ${showSorenessHelp ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}>
                <div className="bg-white dark:bg-surface-dark p-4 rounded-2xl border border-emerald-500/20 shadow-sm text-center">
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                    Indica el dolor muscular residual. Evalúa cuánto te molesta mover o presionar el músculo trabajado anteriormente.
                  </p>
                </div>
              </div>

              <span className={`text-5xl font-black tabular-nums tracking-tighter mt-4 transition-colors duration-300 ${sorenessColorClass}`}>
                {soreness}<span className="text-lg text-slate-300">/10</span>
              </span>
           </div>

           <div className="w-full px-4 mb-2">
              <input 
                  type="range" min="1" max="10" value={soreness} 
                  onChange={(e) => setSoreness(parseInt(e.target.value))}
                  style={{ accentColor: sorenessColor } as any}
                  className="w-full h-4 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer slider-thumb-premium" 
              />
              <div className="flex justify-between mt-3 px-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <span className={`transition-all duration-300 ${soreness <= 3 ? 'text-emerald-500 scale-110 font-black' : 'opacity-40'}`}>Fresco</span>
                  <span className={`transition-all duration-300 ${soreness >= 8 ? 'text-red-500 scale-110 font-black' : 'opacity-40'}`}>Dolorido</span>
              </div>
           </div>
        </div>

        {/* BARRA DE READY SCORE DINÁMICA */}
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
            aria-label="Confirmar preparación y cerrar modal"
          >
            <span className="material-symbols-outlined font-black text-3xl">offline_bolt</span>
            LISTO PARA ENTRENAR
          </button>
        </div>
      </div>

      <style>{`
        .slider-thumb-premium::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 36px;
          height: 36px;
          background: ${sorenessColor};
          cursor: pointer;
          border-radius: 50%;
          border: 5px solid white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          transition: all 0.2s ease-in-out;
        }
        .slider-thumb-premium::-webkit-slider-thumb:active {
          transform: scale(1.25);
        }
      `}</style>
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
    if (p > 15) return { message: "¡Sobrecarga explosiva! Estás ganando fuerza rápido.", label: "ELITE", color: "text-primary" };
    if (p >= 5) return { message: "Progreso constante. Mantén este ritmo.", label: "ÓPTIMO", color: "text-primary" };
    if (p > -5) return { message: "Fase de consolidación. La base es sólida.", label: "ESTABLE", color: "text-slate-400" };
    return { message: "Descarga detectada. Escucha a tu cuerpo.", label: "AJUSTE", color: "text-orange-500" };
  }, [trend]);

  const fetchAiInsight = async () => {
    setLoadingAi(true);
    try {
      const advice = await getVolumeInsight(totalVolume, prevVolume, userProfile);
      setAiInsight(advice);
    } catch (e) {
      setAiInsight("No pude conectar con el entrenador IA en este momento. Mi recomendación es seguir priorizando la técnica.");
    }
    setLoadingAi(false);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-3xl flex items-end animate-in fade-in duration-300">
      <div onClick={onClose} className="absolute inset-0"></div>
      
      <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] h-[92vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-500 relative overflow-hidden">
        {/* Manija de arrastre visual */}
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-6 mb-2 opacity-40"></div>
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between px-8 py-6">
          <div>
            <h3 className="text-3xl font-black tracking-tighter">Análisis de Carga</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Rendimiento Semanal</p>
          </div>
          <button 
            onClick={onClose} 
            className="size-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 active:scale-90 transition-all hover:bg-slate-200 dark:hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-4xl font-black">close</span>
          </button>
        </div>

        {/* Contenido con Scroll */}
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
               "{insight.message}"
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

          {/* NUEVA SECCIÓN: Interpretación IA del volumen */}
          <div className="space-y-4">
            <button 
              onClick={fetchAiInsight}
              disabled={loadingAi}
              className="w-full flex items-center justify-center gap-3 py-6 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl relative overflow-hidden group"
            >
              {loadingAi && <div className="absolute inset-0 bg-primary/20 animate-pulse"></div>}
              <span className="material-symbols-outlined font-black">psychology</span>
              {loadingAi ? 'Analizando tu carga...' : '¿Cómo sé si esto es bueno?'}
            </button>

            {aiInsight && (
              <div className="p-8 rounded-[3rem] bg-gradient-to-br from-primary/5 to-orange-400/5 border-2 border-primary/20 shadow-inner animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-black">
                    <span className="material-symbols-outlined text-sm font-black">bolt</span>
                  </div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-text">Análisis de Nivel</h5>
                </div>
                <p className="text-base font-bold leading-relaxed text-slate-800 dark:text-slate-200">
                  {aiInsight}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botón de Cierre Ampliado y Mejorado */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white dark:from-surface-dark via-white dark:via-surface-dark to-transparent pt-16">
          <button 
            onClick={onClose} 
            className="w-full h-28 bg-primary text-black font-black text-2xl rounded-full shadow-[0_25px_60px_-15px_rgba(255,239,10,0.5)] active:scale-[0.96] transition-all uppercase tracking-[0.25em] flex items-center justify-center gap-4 border-4 border-white/30 dark:border-black/20"
          >
            <span className="material-symbols-outlined font-black text-4xl">check_circle</span>
            CERRAR ANÁLISIS
          </button>
        </div>
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
    setLocalProfile({ ...localProfile, goalSettings: settings });
  };
  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-2xl flex items-end animate-in fade-in duration-300">
      <div onClick={onClose} className="absolute inset-0"></div>
      <div className="w-full max-w-md mx-auto bg-white dark:bg-surface-dark rounded-t-[4rem] p-10 pb-16 shadow-2xl animate-in slide-in-from-bottom duration-500 relative">
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-10 opacity-40"></div>
        <h3 className="text-3xl font-black tracking-tighter mb-8 text-center">Mis Objetivos</h3>
        <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar justify-center">
          {(['sessions', 'prs'] as GoalType[]).map(type => (
            <button key={type} onClick={() => setActiveTab(type)} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2 ${activeTab === type ? 'bg-primary border-primary text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'}`}>{type === 'sessions' ? 'Entrenos' : 'Objetivos'}</button>
          ))}
        </div>
        <div className="flex-1 space-y-10 py-4">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-background-dark p-6 rounded-[2.5rem]">
            <div className="flex items-center gap-4"><div className={`size-12 rounded-xl flex items-center justify-center ${localProfile.goalSettings.activeGoals.includes(activeTab) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}><span className="material-symbols-outlined">{activeTab === 'sessions' ? 'calendar_today' : 'stars'}</span></div><div><p className="font-black text-lg leading-tight">{activeTab === 'sessions' ? 'Sesiones/mes' : 'Récords/mes'}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{localProfile.goalSettings.activeGoals.includes(activeTab) ? 'Visible' : 'Oculto'}</p></div></div>
            <button onClick={() => toggleGoalVisibility(activeTab)} className={`size-14 rounded-2xl flex items-center justify-center transition-all ${localProfile.goalSettings.activeGoals.includes(activeTab) ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}><span className="material-symbols-outlined font-black">{localProfile.goalSettings.activeGoals.includes(activeTab) ? 'check' : 'add'}</span></button>
          </div>
          <div className="flex items-center justify-center gap-12">
            <button onClick={() => updateTarget(activeTab, -1)} className="size-20 rounded-full bg-slate-100 dark:bg-background-dark flex items-center justify-center active:scale-75 shadow-inner border border-black/5"><span className="material-symbols-outlined text-4xl font-black">remove</span></button>
            <div className="text-center"><span className="text-7xl font-black tabular-nums tracking-tighter">{activeTab === 'sessions' ? localProfile.goalSettings.targetSessionsPerMonth : localProfile.goalSettings.targetPRsPerMonth}</span></div>
            <button onClick={() => updateTarget(activeTab, 1)} className="size-20 rounded-full bg-slate-100 dark:bg-background-dark flex items-center justify-center active:scale-75 shadow-inner border border-black/5"><span className="material-symbols-outlined text-4xl font-black">add</span></button>
          </div>
        </div>
        <button onClick={() => { onSave(localProfile); onClose(); }} className="w-full py-8 mt-12 rounded-full bg-black dark:bg-white text-white dark:text-black font-black text-xl shadow-2xl uppercase tracking-[0.2em]">GUARDAR AJUSTES</button>
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
  onShowFatigueDetail: () => void;
  onShowHelp: (metric: keyof typeof METRIC_HELP) => void;
}> = ({ id, stats, dynamicGoals, chartData, onAdjustGoal, onShowVolumeDetail, onShowFatigueDetail, onShowHelp }) => {
  const [activeGoalIdx, setActiveGoalIdx] = useState(0);

  useEffect(() => {
    if (activeGoalIdx >= dynamicGoals.length && dynamicGoals.length > 0) setActiveGoalIdx(0);
  }, [dynamicGoals.length]);

  const MetricLabelHelp = ({ label, metric }: { label: string, metric: keyof typeof METRIC_HELP }) => (
    <div className="flex items-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <button onClick={(e) => { e.stopPropagation(); onShowHelp(metric); }} className="ml-1.5 size-4 inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[10px] font-black">help</span>
      </button>
    </div>
  );

  switch (id) {
    case 'goal':
      const currentGoal = dynamicGoals[activeGoalIdx] || dynamicGoals[0];
      if (!currentGoal) return <div className="bg-black dark:bg-zinc-900 rounded-[4rem] p-12 text-white min-h-[460px] flex flex-col items-center justify-center gap-6 text-center"><span className="material-symbols-outlined text-6xl text-slate-700">ads_click</span><h3 className="text-2xl font-black">Sin Metas</h3><button onClick={onAdjustGoal} className="px-10 py-4 bg-primary text-black rounded-full text-xs font-black uppercase tracking-widest">Configurar</button></div>;
      return (
        <div className="bg-black dark:bg-zinc-900 rounded-[4rem] p-10 text-white min-h-[460px] flex flex-col items-center justify-center gap-8 shadow-2xl border border-white/5 relative overflow-hidden">
          <div className="relative size-56 shrink-0 flex items-center justify-center cursor-pointer select-none group" onClick={() => setActiveGoalIdx((prev) => (prev + 1) % dynamicGoals.length)}>
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
            <svg className="size-full transform -rotate-90 absolute top-0 left-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
              <circle cx="50" cy="50" r="44" stroke={currentGoal.color} strokeWidth="8" fill="transparent" strokeDasharray="276.46" strokeDashoffset={276.46 - (276.46 * currentGoal.progress) / 100} strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <div className="flex flex-col items-center justify-center z-10" key={currentGoal.id}>
              <span className="material-symbols-outlined text-3xl mb-1" style={{ color: currentGoal.color }}>{currentGoal.icon}</span>
              <span className="text-6xl font-black tabular-nums tracking-tighter leading-none">{currentGoal.progress}%</span>
            </div>
          </div>
          <div className="text-center" key={currentGoal.label}>
            <h3 className="text-3xl font-black tracking-tight mb-2">{currentGoal.label}</h3>
            <p className="text-slate-400 text-base font-medium">{currentGoal.current.toLocaleString()} de {currentGoal.target.toLocaleString()} {currentGoal.unit}</p>
            <div className="justify-center gap-2 mt-8 flex">
              {dynamicGoals.map((_, i) => <button key={i} onClick={(e) => { e.stopPropagation(); setActiveGoalIdx(i); }} className={`h-1.5 rounded-full transition-all duration-300 ${activeGoalIdx === i ? 'w-8 bg-primary' : 'w-1.5 bg-white/10'}`} />)}
            </div>
          </div>
        </div>
      );
    case 'quick_stats':
      return (
        <div className="grid grid-cols-2 gap-5 animate-in fade-in min-h-0">
          <div className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-8 border border-black/5 shadow-xl flex flex-col justify-center aspect-square">
             <div className="size-16 rounded-2xl bg-orange-100 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mb-6 shadow-inner"><span className="material-symbols-outlined font-black text-4xl">local_fire_department</span></div>
             <MetricLabelHelp label="Racha" metric="racha" />
             <p className="text-4xl font-black tabular-nums mt-1 tracking-tighter">5 Días</p>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-8 border border-black/5 shadow-xl flex flex-col justify-center aspect-square">
             <div className="size-16 rounded-2xl bg-blue-100 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center mb-6 shadow-inner"><span className="material-symbols-outlined font-black text-4xl">calendar_month</span></div>
             <MetricLabelHelp label="Sesiones" metric="sesiones" />
             <p className="text-4xl font-black tabular-nums mt-1 tracking-tighter">{stats.sessionsCount}/sem</p>
          </div>
        </div>
      );
    case 'volume_chart':
      return (
        <div className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-10 shadow-xl border border-black/5 animate-in fade-in relative min-h-0">
          <div className="flex justify-between items-start mb-10">
            <div><MetricLabelHelp label="Volumen Semanal" metric="volumen" /><h4 className="text-5xl font-black tracking-tighter tabular-nums leading-none mt-1">{stats.totalVolume.toLocaleString()} <span className="text-lg text-slate-300 font-black ml-1">kg</span></h4></div>
            <button onClick={onShowVolumeDetail} className="size-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl hover:rotate-12 transition-all"><span className="material-symbols-outlined text-2xl font-black">query_stats</span></button>
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
        <div className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-12 border border-black/5 animate-in fade-in shadow-xl min-h-0">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-10 text-center">Foco Muscular</h4>
          <div className="flex items-center gap-12">
            <div className="size-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.muscleDist.length > 0 ? stats.muscleDist : [{value: 1}]} innerRadius={45} outerRadius={75} paddingAngle={12} dataKey="value" stroke="none">{stats.muscleDist.map((_: any, i: number) => <Cell key={i} fill={['#FFEF0A', '#E6D709', '#CCBF08'][i % 3]} />)}{stats.muscleDist.length === 0 && <Cell fill="#f1f5f9" className="dark:fill-white/5" />}</Pie></PieChart></ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-6 min-w-0">
              {stats.muscleDist.slice(0, 3).map((item: any) => (
                <div key={item.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"><span className="text-slate-400 truncate pr-4">{item.name}</span><span className="text-slate-950 dark:text-white font-black">{item.percent}%</span></div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-primary" style={{ width: `${item.percent}%` }}></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'recent_prs':
      return (
        <div className="bg-white dark:bg-surface-dark rounded-[4.5rem] p-12 border border-black/5 animate-in fade-in shadow-xl min-h-0">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-10">Recientes</h4>
          <div className="space-y-8">
            {stats.recentPrs.length > 0 ? stats.recentPrs.map((pr: any, i: number) => (
              <div key={i} className="flex items-center gap-8"><div className="size-16 rounded-[1.8rem] bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-inner"><span className="material-symbols-outlined text-4xl font-black">star</span></div><div className="flex-1 min-w-0"><p className="font-black text-2xl truncate tracking-tighter leading-none">{pr.name}</p><p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-2">{pr.weight}kg</p></div></div>
            )) : <p className="text-sm text-slate-400 font-bold italic tracking-wide">¡Sigue entrenando!</p>}
          </div>
        </div>
      );
    default: return null;
  }
};

export default Dashboard;
