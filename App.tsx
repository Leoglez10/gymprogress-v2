
import React, { useState, useEffect, useRef } from 'react';
import { Screen, UserProfile, CustomRoutine } from './types';
import Onboarding from './components/Onboarding';
import Signup from './components/Signup';
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
  
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const DEFAULT_PROFILE: UserProfile = {
    goal: '',
    gender: '',
    age: 25,
    weight: 75,
    height: 175,
    alias: '',
    weightUnit: 'kg',
    goalSettings: {
      targetSessionsPerMonth: 12,
      targetVolumePerWeek: 15000,
      targetPRsPerMonth: 5,
      activeGoals: ['sessions', 'prs']
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
        setUserProfile(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    if (currentScrollY < 20) {
      setIsFooterVisible(true);
      lastScrollY.current = currentScrollY;
      return;
    }

    if (Math.abs(currentScrollY - lastScrollY.current) < 15) return;

    if (currentScrollY > lastScrollY.current) {
      setIsFooterVisible(false);
    } else {
      setIsFooterVisible(true);
    }
    
    lastScrollY.current = currentScrollY;
  };

  const handleStartJourney = () => setCurrentScreen(Screen.SIGNUP);
  const handleSignup = () => setCurrentScreen(Screen.GOAL_SELECTION);

  const handleGoalSelect = (goal: 'Strength' | 'Hypertrophy' | 'WeightLoss') => {
    setUserProfile(prev => ({ ...prev, goal }));
    setCurrentScreen(Screen.BODY_DATA);
  };

  const handleBodyData = (data: { gender: 'Male' | 'Female'; age: number; weight: number; height: number }) => {
    setUserProfile(prev => ({ ...prev, ...data }));
    setCurrentScreen(Screen.ALIAS_SETTING);
  };

  const handleFinishSetup = (alias: string) => {
    const finalProfile = { ...userProfile, alias };
    updateUserProfile(finalProfile);
    localStorage.setItem('gymProgress_setup_complete', 'true');
    setCurrentScreen(Screen.DASHBOARD);
  };

  const updateUserProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('gymProgress_user_profile', JSON.stringify(newProfile));
  };

  const handleLogout = () => {
    const keysToRemove = [
      'gymProgress_setup_complete',
      'gymProgress_user_profile',
      'gymProgress_workout_history',
      'gymProgress_custom_routines',
      'gymProgress_active_session_state',
      'gymProgress_exercises',
      'gymProgress_last_session_volume',
      'gymProgress_last_session_duration',
      'gymProgress_last_session_data',
      'gymProgress_dashboard_widgets_v3'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setUserProfile(DEFAULT_PROFILE);
    setActiveRoutine(null);
    setEditingRoutineId(undefined);
    setCurrentScreen(Screen.ONBOARDING);
  };

  const navigateTo = (screen: Screen) => {
    if (screen !== Screen.CREATE_WORKOUT) {
      setEditingRoutineId(undefined);
    }
    setCurrentScreen(screen);
    setIsFooterVisible(true);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  };

  const handleStartSession = (routine: CustomRoutine) => {
    setActiveRoutine(routine);
    setCurrentScreen(Screen.ACTIVE_SESSION);
  };

  const handleStartFreeSession = () => {
    const now = new Date();
    const freeRoutine: CustomRoutine = {
      id: `free_${Date.now()}`,
      name: `Sesión Libre ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
      exercises: []
    };
    setActiveRoutine(freeRoutine);
    setCurrentScreen(Screen.ACTIVE_SESSION);
  };

  const handleCreateOrEditRoutine = (routineId?: string) => {
    setEditingRoutineId(routineId);
    setCurrentScreen(Screen.CREATE_WORKOUT);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.ONBOARDING: return <Onboarding onStart={handleStartJourney} />;
      case Screen.SIGNUP: return <Signup onBack={() => navigateTo(Screen.ONBOARDING)} onSignup={handleSignup} />;
      case Screen.GOAL_SELECTION: return <GoalSelection onSelect={handleGoalSelect} />;
      case Screen.BODY_DATA: return <BodyData onNext={handleBodyData} />;
      case Screen.ALIAS_SETTING: return <AliasSetting onFinish={handleFinishSetup} />;
      case Screen.DASHBOARD: return <Dashboard onStartWorkout={() => navigateTo(Screen.START_WORKOUT)} userAlias={userProfile.alias} goal={userProfile.goal} isFooterVisible={isFooterVisible} />;
      case Screen.START_WORKOUT: return <StartWorkout onBack={() => navigateTo(Screen.DASHBOARD)} onSessionStart={handleStartSession} onCreateCustom={handleCreateOrEditRoutine} onStartFree={handleStartFreeSession} />;
      case Screen.CREATE_WORKOUT: return <CreateWorkout onBack={() => navigateTo(Screen.START_WORKOUT)} onSave={() => navigateTo(Screen.START_WORKOUT)} initialRoutineId={editingRoutineId} userProfile={userProfile} />;
      case Screen.ACTIVE_SESSION: return <ActiveSession routine={activeRoutine} onFinish={() => navigateTo(Screen.SUMMARY)} onCancel={() => navigateTo(Screen.START_WORKOUT)} userProfile={userProfile} />;
      case Screen.EXERCISE_LIBRARY: return <ExerciseLibrary onBack={() => navigateTo(Screen.DASHBOARD)} />;
      case Screen.STATS: return <Stats onBack={() => navigateTo(Screen.DASHBOARD)} userProfile={userProfile} />;
      case Screen.RISK_ANALYSIS: return <RiskAnalysis onBack={() => navigateTo(Screen.DASHBOARD)} userProfile={userProfile} />;
      case Screen.SUMMARY: return <Summary onDone={() => navigateTo(Screen.DASHBOARD)} userProfile={userProfile} />;
      case Screen.PROFILE: return <Profile onBack={() => navigateTo(Screen.DASHBOARD)} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} userProfile={userProfile} onUpdateProfile={updateUserProfile} onLogout={handleLogout} />;
      default: return <Dashboard onStartWorkout={() => navigateTo(Screen.START_WORKOUT)} userAlias={userProfile.alias} goal={userProfile.goal} isFooterVisible={isFooterVisible} />;
    }
  };

  const showNav = [Screen.DASHBOARD, Screen.EXERCISE_LIBRARY, Screen.STATS, Screen.RISK_ANALYSIS, Screen.PROFILE].includes(currentScreen);

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto relative bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden ring-1 ring-black/5">
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative"
        onScroll={handleScroll}
      >
        {renderScreen()}
      </div>
      {showNav && <Navigation currentScreen={currentScreen} onNavigate={navigateTo} isVisible={isFooterVisible} />}
    </div>
  );
};

export default App;
