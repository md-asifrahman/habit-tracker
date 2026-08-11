import { api } from './api-client';

export type ChallengeStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
/** The phone's own notification sound, or none at all. */
export type SoundKey = 'default' | 'silent';

export const SOUND_OPTIONS: { key: SoundKey; label: string; hint: string }[] = [
  { key: 'default', label: 'Device default', hint: 'The phone’s notification sound' },
  { key: 'silent', label: 'Silent', hint: 'Show the reminder without a sound' },
];

/** Records written before the bundled-sound options were dropped can still carry old names. */
export function normalizeSound(value: string | null | undefined): SoundKey {
  return value === 'silent' ? 'silent' : 'default';
}

export interface ChallengeTask {
  id: string;
  title: string;
  sortOrder: number;
}

export interface Challenge {
  id: string;
  title: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  dayNumber: number;
  reminderTime: string; // HH:mm:ss
  reminderSound: SoundKey;
  repeatEnabled: boolean;
  repeatEveryMin: number;
  tasks: ChallengeTask[];
}

export interface ChallengeInput {
  title: string;
  durationDays: number;
  startDate?: string;
  reminderTime: string; // HH:mm
  reminderSound: SoundKey;
  repeatEnabled: boolean;
  repeatEveryMin: number;
  tasks: string[];
}

/** The whole challenge, sent to PUT /challenges/{id} to create-or-replace it. */
export interface ChallengeUpsertInput {
  title: string;
  durationDays: number;
  startDate: string;
  status: ChallengeStatus;
  reminderTime: string;
  reminderSound: SoundKey;
  repeatEnabled: boolean;
  repeatEveryMin: number;
  tasks: { id?: string; title: string }[];
}

export interface DayLog {
  id: string;
  date: string;
  completionPercent: number;
  completedCount: number;
  taskCount: number;
  note: string | null;
  completedTaskIds: string[];
}

export interface ChallengeReport {
  challengeId: string;
  title: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  daysElapsed: number;
  daysLogged: number;
  daysMissed: number;
  perfectDays: number;
  averagePercent: number;
  bestStreak: number;
  days: {
    dayNumber: number;
    date: string;
    completionPercent: number;
    logged: boolean;
    future: boolean;
  }[];
  taskBreakdown: {
    taskId: string;
    title: string;
    completedDays: number;
    elapsedDays: number;
    percent: number;
  }[];
}

export const challengesApi = {
  list: () => api.get<Challenge[]>('/challenges'),
  get: (id: string) => api.get<Challenge>(`/challenges/${id}`),
  create: (input: ChallengeInput) => api.post<Challenge>('/challenges', input),
  upsert: (id: string, input: ChallengeUpsertInput) => api.put<Challenge>(`/challenges/${id}`, input),
  abandon: (id: string) => api.post<Challenge>(`/challenges/${id}/abandon`),
  remove: (id: string) => api.delete<void>(`/challenges/${id}`),
  logs: (id: string) => api.get<DayLog[]>(`/challenges/${id}/logs`),
  logDay: (id: string, date: string, completedTaskIds: string[], note?: string) =>
    api.put<DayLog>(`/challenges/${id}/logs`, { date, completedTaskIds, note }),
  report: (id: string) => api.get<ChallengeReport>(`/challenges/${id}/report`),
};

/** yyyy-mm-dd in the browser's timezone. */
export function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** "22:00" or "22:00:00" -> "10:00 PM" */
export function formatTime(value: string): string {
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function soundLabel(key: SoundKey): string {
  return SOUND_OPTIONS.find((option) => option.key === normalizeSound(key))!.label;
}
