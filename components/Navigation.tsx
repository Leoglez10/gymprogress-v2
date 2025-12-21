
import React from 'react';
import { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { screen: Screen.DASHBOARD, label: 'Inicio', icon: 'home' },
    { screen: Screen.EXERCISE_LIBRARY, label: 'Biblioteca', icon: 'fitness_center' },
    { screen: Screen.RISK_ANALYSIS, label: 'Riesgo', icon: 'ecg_heart' },
    { screen: Screen.PROFILE, label: 'Perfil', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl border-t border-black/5 dark:border-white/5 pt-3 flex justify-around items-center z-[80]" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
      {navItems.map((item) => (
        <button
          key={item.screen}
          onClick={() => onNavigate(item.screen)}
          aria-label={item.label}
          className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] transition-all active:scale-90 ${
            currentScreen === item.screen
              ? 'text-slate-950 dark:text-white'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <span className={`material-symbols-outlined text-[28px] ${currentScreen === item.screen ? 'fill-1 font-bold' : ''}`}>
            {item.icon}
          </span>
          <span className={`text-[10px] tracking-tight ${currentScreen === item.screen ? 'font-black' : 'font-bold'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
