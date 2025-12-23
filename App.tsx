
import React, { useState, useEffect, useRef } from 'react';
import { Screen, UserProfile, CustomRoutine } from './types';
import Onboarding from './components/Onboarding';
import Signup from './components/Signup';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import GoalSelection from './components/GoalSelection';
import BodyData from './components/BodyData';
import AliasSetting from './components/AliasSetting';
import Dashboard from './components/Dashboard';
import StartWorkout from './components/StartWorkout';
import CreateWorkout from './components/CreateWorkout';
import ActiveSession from './components/ActiveSession';
import ExerciseLibrary from './components/ExerciseLibrary';
import Stats from './components/Stats';
import RiskAnalysis from './components/RiskAnalysis';
import Summary from './components/Summary';
import Profile from './components/Profile';
import Navigation from './components/Navigation';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.ONBOARDING);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | undefined>(undefined);
  const [activeRoutine, setActiveRoutine] = useState<CustomRoutine | null>(null);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  
  // Accesibilidad Global
  const [highContrast, setHighContrast] = useState(localStorage.getItem('gym_acc_contrast') === 'true');
  const [reducedMotion, setReducedMotion] = useState(localStorage.getItem('gym_acc_motion') === 'true');
  const [highlightedButtons, setHighlightedButtons] = useState(localStorage.getItem('gym_acc_highlight') === 'true');

  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const DEFAULT_PROFILE: UserProfile = {
    goal: '',
    gender: '',
    age: 25,
    weight: 75,
    height: 175,
    alias: '',
    avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop',
    weightUnit: 'kg',
    goalSettings: {
      targetSessionsPerMonth: 12,
      targetVolumePerWeek: 15000,
      targetPRsPerMonth: 5,
      activeGoals: ['sessions', 'prs', 'volume']
    }
  };

  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const setupComplete = localStorage.getItem('gymProgress_setup_complete');
    const savedProfile = localStorage.getItem('gymProgress_user_profile');
    const activeSessionState = localStorage.getItem('gymProgress_active_session_state');
    
    if (setupComplete === 'true') {
      if (activeSessionState) {
        try {
          const parsed = JSON.parse(activeSessionState);
          setActiveRoutine(parsed.routine);
          setCurrentScreen(Screen.ACTIVE_SESSION);
        } catch (e) {
          setCurrentScreen(Screen.DASHBOARD);
        }
      } else {
        setCurrentScreen(Screen.DASHBOARD);
      }
      
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (!parsed.goalSettings.targetPRsPerMonth) parsed.goalSettings.targetPRsPerMonth = 5;
        if (!parsed.weightUnit) parsed.weightUnit = 'kg';
        if (!parsed.avatarUrl) parsed.avatarUrl = DEFAULT_PROFILE.avatarUrl;
        setUserProfile(parsed);
      }
    }
  }, []);

  // Aplicar clases de Accesibilidad y Dark Mode
  useEffect(() => {
    const root = document.documentElement;
    
    // Dark Mode
    if (isDarkMode) root.classList.add('dark'); else root.classList.remove('dark');
    
    // Accesibilidad
    if (highContrast) root.classList.add('high-contrast'); else root.classList.remove('high-contrast');
    if (reducedMotion) root.classList.add('reduced-motion'); else root.classList.remove('reduced-motion');
    if (highlightedButtons) root.classList.add('highlighted-buttons'); else root.classList.remove('highlighted-buttons');
    
    localStorage.setItem('gym_acc_contrast', String(highContrast));
    localStorage.setItem('gym_acc_motion', String(reducedMotion));
    localStorage.setItem('gym_acc_highlight', String(highlightedButtons));
  }, [isDarkMode, highContrast, reducedMotion, highlightedButtons]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY < 20) {
      setIsFooterVisible(true);
      lastScrollY.current = currentScrollY;
      return;
    }
    if (Math.abs(currentScrollY - lastScrollY.current) < 15) return;
    if (currentScrollY > lastScrollY.current) setIsFooterVisible(false);
    else setIsFooterVisible(true);
    lastScrollY.current = currentScrollY;
  };

  const handleLogout = () => {
    const keysToRemove = [
      'gymProgress_setup_complete', 'gymProgress_user_profile', 'gymProgress_workout_history',
      'gymProgress_custom_routines', 'gymProgress_active_session_state', 'gymProgress_exercises',
      'gymProgress_last_session_volume', 'gymProgress_last_session_duration', 'gymProgress_last_session_data',
      'gymProgress_dashboard_widgets_v3', 'gym_acc_contrast', 'gym_acc_motion', 'gym_acc_highlight'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setUserProfile(DEFAULT_PROFILE);
    setActiveRoutine(null);
    setCurrentScreen(Screen.ONBOARDING);
    setHighContrast(false);
    setReducedMotion(false);
    setHighlightedButtons(false);
  };

  const navigateTo = (screen: Screen) => {
    if (screen !== Screen.CREATE_WORKOUT) setEditingRoutineId(undefined);
    setCurrentScreen(screen);
    setIsFooterVisible(true);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  };

  const updateUserProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('gymProgress_user_profile', JSON.stringify(newProfile));
  };

  const showNav = [Screen.DASHBOARD, Screen.EXERCISE_LIBRARY, Screen.STATS, Screen.RISK_ANALYSIS, Screen.PROFILE].includes(currentScreen);

  return (
    <div className={`flex flex-col h-[100dvh] max-w-md mx-auto relative bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden ring-1 ring-black/5 ${reducedMotion ? 'animate-none' : ''}`}>
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative"
        onScroll={handleScroll}
      >
        {currentScreen === Screen.ONBOARDING && <Onboarding onStart={() => navigateTo(Screen.SIGNUP)} />}
        {currentScreen === Screen.SIGNUP && <Signup onBack={() => navigateTo(Screen.ONBOARDING)} onSignup={() => navigateTo(Screen.GOAL_SELECTION)} onLoginClick={() => navigateTo(Screen.LOGIN)} />}
        {currentScreen === Screen.LOGIN && <Login onBack={() => navigateTo(Screen.ONBOARDING)} onLogin={() => navigateTo(Screen.DASHBOARD)} onSignupClick={() => navigateTo(Screen.SIGNUP)} onForgotPasswordClick={() => navigateTo(Screen.FORGOT_PASSWORD)} />}
        {currentScreen === Screen.GOAL_SELECTION && <GoalSelection onSelect={(goal) => { setUserProfile({...userProfile, goal}); navigateTo(Screen.BODY_DATA); }} />}
        {currentScreen === Screen.BODY_DATA && <BodyData onNext={(data) => { setUserProfile({...userProfile, ...data}); navigateTo(Screen.ALIAS_SETTING); }} />}
        {currentScreen === Screen.ALIAS_SETTING && <AliasSetting onFinish={(alias) => { updateUserProfile({...userProfile, alias}); navigateTo(Screen.DASHBOARD); localStorage.setItem('gymProgress_setup_complete', 'true'); }} />}
        {currentScreen === Screen.DASHBOARD && (
          <Dashboard 
            onStartWorkout={() => navigateTo(Screen.START_WORKOUT)} 
            onNavigateToStats={() => navigateTo(Screen.STATS)} 
            userAlias={userProfile.alias} 
            avatarUrl={userProfile.avatarUrl}
            goal={userProfile.goal} 
            isFooterVisible={isFooterVisible} 
          />
        )}
        {currentScreen === Screen.START_WORKOUT && <StartWorkout onBack={() => navigateTo(Screen.DASHBOARD)} onSessionStart={(r) => { setActiveRoutine(r); navigateTo(Screen.ACTIVE_SESSION); }} onCreateCustom={(id) => { setEditingRoutineId(id); navigateTo(Screen.CREATE_WORKOUT); }} onStartFree={() => { setActiveRoutine({id: `free_${Date.now()}`, name: 'Sesión Libre', exercises: []}); navigateTo(Screen.ACTIVE_SESSION); }} />}
        {currentScreen === Screen.CREATE_WORKOUT && <CreateWorkout onBack={() => navigateTo(Screen.START_WORKOUT)} onSave={() => navigateTo(Screen.START_WORKOUT)} initialRoutineId={editingRoutineId} userProfile={userProfile} />}
        {currentScreen === Screen.ACTIVE_SESSION && <ActiveSession routine={activeRoutine} onFinish={() => navigateTo(Screen.SUMMARY)} onCancel={() => navigateTo(Screen.START_WORKOUT)} userProfile={userProfile} />}
        {currentScreen === Screen.EXERCISE_LIBRARY && <ExerciseLibrary onBack={() => navigateTo(Screen.DASHBOARD)} isFooterVisible={isFooterVisible} onToggleFooter={setIsFooterVisible} />}
        {currentScreen === Screen.STATS && <Stats onBack={() => navigateTo(Screen.DASHBOARD)} userProfile={userProfile} />}
        {currentScreen === Screen.RISK_ANALYSIS && <RiskAnalysis onBack={() => navigateTo(Screen.DASHBOARD)} userProfile={userProfile} />}
        {currentScreen === Screen.SUMMARY && <Summary onDone={() => navigateTo(Screen.DASHBOARD)} userProfile={userProfile} />}
        {currentScreen === Screen.PROFILE && (
          <Profile 
            onBack={() => navigateTo(Screen.DASHBOARD)} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
            userProfile={userProfile} 
            onUpdateProfile={updateUserProfile} 
            onLogout={handleLogout}
            accSettings={{
              highContrast, setHighContrast,
              reducedMotion, setReducedMotion,
              highlightedButtons, setHighlightedButtons
            }}
          />
        )}
      </div>
      {showNav && <Navigation currentScreen={currentScreen} onNavigate={navigateTo} isVisible={isFooterVisible} />}
    </div>
  );
};

export default App;
