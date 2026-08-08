import { api } from './api-client';

export type HabitType = 'BUILD' | 'BREAK';
export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'CUSTOM';
export type HabitIcon = 'walk' | 'droplet' | 'book' | 'ban' | 'leaf';
export type HabitColor = 'accent' | 'teal' | 'coral' | 'amber';

export interface Habit {
  id: string;
  title: string;
  description: string | null;
  type: HabitType;
  frequency: HabitFrequency;
  icon: HabitIcon;
  color: HabitColor;
  archived: boolean;
}

export interface HabitInput {
  title: string;
  description?: string;
  type: HabitType;
  frequency: HabitFrequency;
  icon: HabitIcon;
  color: HabitColor;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

export interface Challenge {
  id: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  dayNumber: number;
}

export interface CheckIn {
  id: string;
  date: string;
  completed: boolean;
  note: string | null;
}

export const habitsApi = {
  list: () => api.get<Habit[]>('/habits'),
  create: (input: HabitInput) => api.post<Habit>('/habits', input),
  get: (id: string) => api.get<Habit>(`/habits/${id}`),
  update: (id: string, input: HabitInput) => api.put<Habit>(`/habits/${id}`, input),
  remove: (id: string) => api.delete<void>(`/habits/${id}`),
  stats: (id: string) => api.get<HabitStats>(`/habits/${id}/stats`),
  activeChallenge: (id: string) =>
    api.get<Challenge>(`/habits/${id}/challenges/active`).catch(() => null),
  startChallenge: (id: string, durationDays: number) =>
    api.post<Challenge>(`/habits/${id}/challenges`, { durationDays }),
  checkIns: (id: string) => api.get<CheckIn[]>(`/habits/${id}/checkins`),
  checkIn: (id: string, date: string, completed: boolean) =>
    api.post<CheckIn>(`/habits/${id}/checkins`, { date, completed }),
};
