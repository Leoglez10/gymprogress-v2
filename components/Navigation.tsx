
import React from 'react';
import { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isVisible?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate, isVisible = true }) => {
  const navItems = [
    { screen: Screen.DASHBOARD, label: 'Inicio', icon: 'home' },
    { screen: Screen.STATS, label: 'Análisis', icon: 'monitoring' },
    { screen: Screen.EXERCISE_LIBRARY, label: 'Ejercicios', icon: 'fitness_center' },
    { screen: Screen.RISK_ANALYSIS, label: 'Salud', icon: 'ecg_heart' },
    { screen: Screen.PROFILE, label: 'Perfil', icon: 'person' },
  ];

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-black/5 dark:border-white/5 pt-3 flex justify-around items-center z-[80] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'
      }`}
      style={{ 
        paddingBottom: 'calc(max(1rem, env(safe-area-inset-bottom)) + 4px)',
        height: 'calc(80px + env(safe-area-inset-bottom))'
      }}
    >
      {navItems.map((item) => (
        <button
          key={item.screen}
          onClick={() => onNavigate(item.screen)}
          aria-label={item.label}
          className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] transition-all active:scale-90 ${
            currentScreen === item.screen
              ? 'text-slate-950 dark:text-white'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <span className={`material-symbols-outlined text-[26px] ${currentScreen === item.screen ? 'fill-1 font-bold text-primary' : ''}`}>
            {item.icon}
          </span>
          <span className={`text-[9px] tracking-tight ${currentScreen === item.screen ? 'font-black' : 'font-bold'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
