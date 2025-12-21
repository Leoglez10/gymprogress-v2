
export enum Screen {
  ONBOARDING = 'ONBOARDING',
  SIGNUP = 'SIGNUP',
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
  PROFILE = 'PROFILE'
}

export type GoalType = 'sessions' | 'prs' | 'volume';

export interface GoalSettings {
  targetSessionsPerMonth: number;
  targetVolumePerWeek: number;
  targetPRsPerMonth: number;
  activeGoals: GoalType[];
}

export interface UserProfile {
  goal: 'Strength' | 'Hypertrophy' | 'WeightLoss' | '';
  gender: 'Male' | 'Female' | '';
  age: number;
  weight: number;
  height: number;
  alias: string;
  goalSettings: GoalSettings;
  weightUnit: 'kg' | 'lb';
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  type: 'Strength' | 'Cardio' | 'Stretching' | 'Compound' | 'Bodyweight';
  thumbnail: string;
}

export interface CustomExerciseEntry {
  exerciseId: string;
  name: string;
  sets: { reps: number; weight: number; completed?: boolean }[];
}

export interface CustomRoutine {
  id: string;
  name: string;
  exercises: CustomExerciseEntry[];
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface CurrentWorkout {
  id: string;
  name: string;
  exercises: {
    exerciseId: string;
    sets: WorkoutSet[];
  }[];
}
