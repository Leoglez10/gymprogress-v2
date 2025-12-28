
export enum Screen {
  ONBOARDING = 'ONBOARDING',
  SIGNUP = 'SIGNUP',
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  GOAL_SELECTION = 'GOAL_SELECTION',
  BODY_DATA = 'BODY_DATA',
  ALIAS_SETTING = 'ALIAS_SETTING',
  DASHBOARD = 'DASHBOARD',
  START_WORKOUT = 'START_WORKOUT',
  CREATE_WORKOUT = 'CREATE_WORKOUT',
  ACTIVE_SESSION = 'ACTIVE_SESSION',
  EXERCISE_LIBRARY = 'EXERCISE_LIBRARY',
  STATS = 'STATS',
  RISK_ANALYSIS = 'RISK_ANALYSIS',
  SUMMARY = 'SUMMARY',
  PROFILE = 'PROFILE',
  MANUAL_LOG = 'MANUAL_LOG'
}

export type GoalType = 'sessions' | 'prs' | 'volume';

export interface GoalSettings {
  targetSessionsPerMonth: number;
  targetVolumePerWeek: number;
  targetPRsPerMonth: number;
  activeGoals: GoalType[];
}

export interface NotificationSettings {
  workoutReminders: boolean;
  weeklySummaries: boolean;
  aiTips: boolean;
}

export interface UserProfile {
  goal: string;
  gender: string;
  age: number;
  weight: number;
  height: number;
  alias: string;
  avatarUrl?: string;
  weightUnit: 'kg' | 'lb';
  goalSettings: GoalSettings;
  notificationSettings: NotificationSettings;
}

export interface WellnessEntry {
  date: string;
  sleep: number; // 1-3 (Pobre, Normal, Excelente)
  energy: number; // 1-3
  stress: number; // 1-3
  soreness: number; // 1-3
}

export interface Set {
  weight: number;
  reps: number;
  completed?: boolean;
  // Added duration property to allow tracking time taken per set in components like ActiveSession.tsx
  duration?: number;
}

export interface CustomExerciseEntry {
  exerciseId: string;
  name: string;
  sets: Set[];
}

export interface CustomRoutine {
  id: string;
  name: string;
  exercises: CustomExerciseEntry[];
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  category: 'Push' | 'Pull' | 'Legs' | 'Core';
  type: string;
  thumbnail: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  equipment: 'Mancuernas' | 'Barra' | 'Polea' | 'Peso Corporal' | 'Máquina';
  isFavorite?: boolean;
  lastWeight?: number;
}