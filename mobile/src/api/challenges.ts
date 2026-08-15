import { api } from './client';
import type { ChallengeStatus, SoundKey } from '../store/types';

export interface RemoteChallenge {
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
  tasks: { id: string; title: string; sortOrder: number }[];
  restDays: number[];
  updatedAt: string;
}

export interface RemoteDayLog {
  id: string;
  date: string;
  completionPercent: number;
  completedCount: number;
  taskCount: number;
  note: string | null;
  completedTaskIds: string[];
  updatedAt: string;
}

export interface ChallengeUpsertBody {
  title: string;
  durationDays: number;
  startDate: string;
  status: ChallengeStatus;
  reminderTime: string;
  reminderSound: SoundKey;
  repeatEnabled: boolean;
  repeatEveryMin: number;
  tasks: { id: string; title: string }[];
  restDays: number[];
}

export const challengesApi = {
  list: () => api.get<RemoteChallenge[]>('/challenges'),
  upsert: (id: string, body: ChallengeUpsertBody) => api.put<RemoteChallenge>(`/challenges/${id}`, body),
  remove: (id: string) => api.delete<void>(`/challenges/${id}`),
  logs: (id: string) => api.get<RemoteDayLog[]>(`/challenges/${id}/logs`),
  logDay: (id: string, date: string, completedTaskIds: string[], note?: string) =>
    api.put<RemoteDayLog>(`/challenges/${id}/logs`, { date, completedTaskIds, note }),
};
