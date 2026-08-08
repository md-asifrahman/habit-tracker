export type HabitType = 'BUILD' | 'BREAK';
export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'CUSTOM';
export type HabitIconKey = 'walk' | 'droplet' | 'book' | 'ban' | 'leaf';
export type HabitColorKey = 'accent' | 'teal' | 'coral' | 'amber';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  type: HabitType;
  frequency: HabitFrequency;
  icon: HabitIconKey;
  color: HabitColorKey;
  archived: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // yyyy-mm-dd
  completed: boolean;
}

export type ChallengeStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface Challenge {
  id: string;
  habitId: string;
  durationDays: number;
  startDate: string;
  status: ChallengeStatus;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}
