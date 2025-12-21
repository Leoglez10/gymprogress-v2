
import React, { useEffect, useState, useRef } from 'react';
import { UserProfile } from '../types';

interface SummaryProps {
  onDone: () => void;
  userProfile: UserProfile;
}

const Summary: React.FC<SummaryProps> = ({ onDone, userProfile }) => {
  const [stats, setStats] = useState({ volume: 0, duration: 0 });
  const [translateY, setTranslateY] = useState(0);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    const vol = parseInt(localStorage.getItem('gymProgress_last_session_volume') || '0');
    const dur = parseInt(localStorage.getItem('gymProgress_last_session_duration') || '0');
    setStats({ volume: vol, duration: dur });

    const saved = localStorage.getItem('gymProgress_workout_history');
    const history = saved ? JSON.parse(saved) : [];
    
    const newRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      volume: vol,
      duration: `${Math.floor(dur / 60)}m`,
      unit: userProfile.weightUnit
    };

    localStorage.setItem('gymProgress_workout_history', JSON.stringify([...history, newRecord]));
    localStorage.removeItem('gymProgress_last_session_data');
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;
    if (diff > 0) setTranslateY(diff * 0.6);
  };
  const handleTouchEnd = () => {
    if (translateY > 150) onDone(); else setTranslateY(0);
    touchStartRef.current = null;
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}m`;

  return (
    <div 
      className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display relative pb-12 transition-transform duration-300 ease-out overflow-hidden"
      style={{ transform: `translateY(${translateY}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="sticky top-0 z-50 flex items-center p-4 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 pt-[env(safe-area-inset-top)]">
        <h2 className="text-lg font-bold flex-1 text-center">Resumen de Hoy</h2>
      </div>
      <div className="flex-1 flex flex-col items-center px-5 pt-8">
        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-6 shadow-2xl shadow-primary/40 animate-in zoom-in-50 duration-500">
          <span className="material-symbols-outlined text-black text-6xl">emoji_events</span>
        </div>
        <h1 className="text-[32px] font-bold text-center tracking-tight leading-tight mb-2">¡Entrenamiento Brutal!</h1>
        <div className="w-full flex flex-col gap-4 mt-8">
          <div className="bg-white dark:bg-surface-dark p-7 rounded-[2rem] shadow-sm border border-black/5 flex flex-col items-center">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Volumen Desplazado</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter tabular-nums">{stats.volume.toLocaleString()}</span>
              <span className="text-xl text-slate-300 font-bold uppercase">{userProfile.weightUnit}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatSmall label="Duración" value={formatTime(stats.duration)} icon="timer" />
            <StatSmall label="Calorías Est." value={Math.round(stats.volume * 0.04).toString()} icon="local_fire_department" />
          </div>
        </div>
        <button onClick={onDone} className="w-full mt-10 h-20 bg-primary text-black rounded-full flex items-center justify-center gap-3 font-black text-xl shadow-xl active:scale-95 transition-all">GUARDAR Y CONTINUAR</button>
      </div>
    </div>
  );
};

const StatSmall: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="bg-white dark:bg-surface-dark p-5 rounded-[1.5rem] shadow-sm flex flex-col items-center gap-1 border border-black/5">
    <span className="material-symbols-outlined text-primary text-[24px]">{icon}</span>
    <p className="text-lg font-bold">{value}</p>
    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{label}</p>
  </div>
);

export default Summary;
