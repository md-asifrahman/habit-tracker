import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { cancelReminders, normalizeSound, syncReminders } from '../notifications/reminders';
import { addDaysIso, daysBetween, todayIso, uuid } from './id';
import type { Challenge, ChallengeReport, DayCell, DayLog, SoundKey, TaskBreakdown } from './types';

export interface ChallengeDraft {
  title: string;
  durationDays: number;
  reminderTime: string;
  reminderSound: SoundKey;
  repeatEnabled: boolean;
  repeatEveryMin: number;
  taskTitles: string[];
}

interface ChallengesState {
  challenges: Challenge[];
  logs: DayLog[];
  /** Challenges deleted on this device, kept until the deletion has been pushed to the server. */
  deletedIds: string[];
  addChallenge: (draft: ChallengeDraft) => Challenge;
  updateChallenge: (id: string, draft: ChallengeDraft) => void;
  abandonChallenge: (id: string) => void;
  deleteChallenge: (id: string) => void;
  logDay: (challengeId: string, date: string, completedTaskIds: string[]) => void;
  logFor: (challengeId: string, date: string) => DayLog | undefined;
  activeChallenges: () => Challenge[];
  dayNumber: (challenge: Challenge) => number;
  report: (challengeId: string) => ChallengeReport | null;
  /** Re-arms every challenge's notifications — run at app start and after edits. */
  syncAllReminders: () => Promise<void>;
  /** Replaces local state with the result of a server merge. */
  applyMerge: (next: { challenges: Challenge[]; logs: DayLog[] }) => void;
  clearTombstones: (ids: string[]) => void;
}

function percent(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done * 100) / total);
}

export const useChallengesStore = create<ChallengesState>()(
  persist(
    (set, get) => ({
      challenges: [],
      logs: [],
      deletedIds: [],

      addChallenge: (draft) => {
        const startDate = todayIso();
        const challenge: Challenge = {
          id: uuid(),
          title: draft.title.trim(),
          durationDays: draft.durationDays,
          startDate,
          endDate: addDaysIso(startDate, draft.durationDays - 1),
          status: 'ACTIVE',
          reminderTime: draft.reminderTime,
          reminderSound: draft.reminderSound,
          repeatEnabled: draft.repeatEnabled,
          repeatEveryMin: draft.repeatEveryMin,
          tasks: draft.taskTitles.map((title) => ({ id: uuid(), title: title.trim() })),
          notificationIds: [],
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ challenges: [challenge, ...state.challenges] }));
        void get().syncAllReminders();
        return challenge;
      },

      updateChallenge: (id, draft) => {
        set((state) => ({
          challenges: state.challenges.map((challenge) => {
            if (challenge.id !== id) return challenge;
            // Tasks are matched by title so already-logged history keeps pointing at the same ids.
            const tasks = draft.taskTitles.map((title) => {
              const existing = challenge.tasks.find((task) => task.title === title.trim());
              return existing ?? { id: uuid(), title: title.trim() };
            });
            return {
              ...challenge,
              title: draft.title.trim(),
              reminderTime: draft.reminderTime,
              reminderSound: draft.reminderSound,
              repeatEnabled: draft.repeatEnabled,
              repeatEveryMin: draft.repeatEveryMin,
              tasks,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
        void get().syncAllReminders();
      },

      abandonChallenge: (id) => {
        const challenge = get().challenges.find((candidate) => candidate.id === id);
        if (challenge) void cancelReminders(challenge.notificationIds);
        set((state) => ({
          challenges: state.challenges.map((candidate) =>
            candidate.id === id
              ? { ...candidate, status: 'ABANDONED', notificationIds: [], updatedAt: new Date().toISOString() }
              : candidate,
          ),
        }));
      },

      deleteChallenge: (id) => {
        const challenge = get().challenges.find((candidate) => candidate.id === id);
        if (challenge) void cancelReminders(challenge.notificationIds);
        set((state) => ({
          challenges: state.challenges.filter((candidate) => candidate.id !== id),
          logs: state.logs.filter((log) => log.challengeId !== id),
          // Remembered until the next sync, otherwise the server would just send it back.
          deletedIds: [...state.deletedIds, id],
        }));
      },

      logDay: (challengeId, date, completedTaskIds) => {
        const challenge = get().challenges.find((candidate) => candidate.id === challengeId);
        if (!challenge) return;
        const taskCount = challenge.tasks.length;
        const entry: DayLog = {
          id: uuid(),
          challengeId,
          date,
          completedTaskIds,
          taskCount,
          completionPercent: percent(completedTaskIds.length, taskCount),
          updatedAt: new Date().toISOString(),
        };
        set((state) => {
          const existing = state.logs.find((log) => log.challengeId === challengeId && log.date === date);
          return {
            logs: existing
              ? state.logs.map((log) => (log.id === existing.id ? { ...entry, id: existing.id } : log))
              : [...state.logs, entry],
          };
        });
        // Logging the day drops the rest of today's nags.
        void get().syncAllReminders();
      },

      logFor: (challengeId, date) =>
        get().logs.find((log) => log.challengeId === challengeId && log.date === date),

      activeChallenges: () => {
        const today = todayIso();
        return get().challenges.filter(
          (challenge) => challenge.status === 'ACTIVE' && challenge.endDate >= today,
        );
      },

      dayNumber: (challenge) => {
        const elapsed = daysBetween(challenge.startDate, todayIso()) + 1;
        return Math.max(1, Math.min(elapsed, challenge.durationDays));
      },

      report: (challengeId) => {
        const challenge = get().challenges.find((candidate) => candidate.id === challengeId);
        if (!challenge) return null;

        const today = todayIso();
        const logs = get().logs.filter((log) => log.challengeId === challengeId);
        const byDate = new Map(logs.map((log) => [log.date, log]));
        // Days that have already happened — the denominator, so skipped days pull the average down.
        const elapsed = Math.max(
          0,
          Math.min(daysBetween(challenge.startDate, today) + 1, challenge.durationDays),
        );

        const days: DayCell[] = [];
        let percentSum = 0;
        let perfectDays = 0;
        let bestStreak = 0;
        let running = 0;

        for (let i = 0; i < challenge.durationDays; i++) {
          const date = addDaysIso(challenge.startDate, i);
          const future = i >= elapsed;
          const log = byDate.get(date);
          const completionPercent = log?.completionPercent ?? 0;

          if (!future) {
            percentSum += completionPercent;
            if (completionPercent === 100) {
              perfectDays++;
              running++;
              bestStreak = Math.max(bestStreak, running);
            } else {
              running = 0;
            }
          }
          days.push({ dayNumber: i + 1, date, completionPercent, logged: !!log, future });
        }

        const taskBreakdown: TaskBreakdown[] = challenge.tasks.map((task) => {
          const completedDays = logs.filter((log) => log.completedTaskIds.includes(task.id)).length;
          return {
            taskId: task.id,
            title: task.title,
            completedDays,
            elapsedDays: elapsed,
            percent: percent(completedDays, elapsed),
          };
        });

        const daysLogged = logs.filter((log) => log.date <= today).length;

        return {
          daysElapsed: elapsed,
          daysLogged,
          daysMissed: Math.max(0, elapsed - daysLogged),
          perfectDays,
          averagePercent: elapsed === 0 ? 0 : Math.round(percentSum / elapsed),
          bestStreak,
          days,
          taskBreakdown,
        };
      },

      syncAllReminders: async () => {
        const { challenges, logs } = get();
        const updated = await Promise.all(
          challenges.map(async (challenge) => {
            if (challenge.status !== 'ACTIVE') return challenge;
            const logged = new Set(
              logs.filter((log) => log.challengeId === challenge.id).map((log) => log.date),
            );
            const notificationIds = await syncReminders(challenge, logged);
            return { ...challenge, notificationIds };
          }),
        );
        set({ challenges: updated });
      },

      applyMerge: ({ challenges, logs }) => set({ challenges, logs }),

      clearTombstones: (ids) =>
        set((state) => ({ deletedIds: state.deletedIds.filter((id) => !ids.includes(id)) })),
    }),
    {
      name: 'habittracker.challenges',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v0 offered bundled sound names (chime/bell/marimba) that never actually played;
      // everything that isn't "silent" is now the device's own notification sound.
      migrate: (persisted) => {
        const state = persisted as { challenges?: Challenge[] };
        return {
          ...(persisted as object),
          challenges: (state.challenges ?? []).map((challenge) => ({
            ...challenge,
            reminderSound: normalizeSound(challenge.reminderSound),
          })),
        } as never;
      },
      partialize: (state) => ({
        challenges: state.challenges,
        logs: state.logs,
        deletedIds: state.deletedIds,
      }),
    },
  ),
);
