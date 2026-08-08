import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { generateId, isoDaysAgo, todayIso } from './id';
import { Challenge, Habit, HabitLog, HabitStats } from './types';

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  challenges: Challenge[];
  hasSeeded: boolean;
  seedIfEmpty: () => void;
  addHabit: (input: Omit<Habit, 'id' | 'archived' | 'createdAt'>) => Habit;
  updateHabit: (id: string, input: Omit<Habit, 'id' | 'archived' | 'createdAt'>) => void;
  archiveHabit: (id: string) => void;
  startChallenge: (habitId: string, durationDays: number) => void;
  toggleCheckIn: (habitId: string, date: string) => void;
  isDoneOn: (habitId: string, date: string) => boolean;
  activeChallenge: (habitId: string) => (Challenge & { dayNumber: number }) | null;
  stats: (habitId: string) => HabitStats;
  completedDates: (habitId: string) => Set<string>;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      challenges: [],
      hasSeeded: false,

      seedIfEmpty: () => {
        if (get().hasSeeded) return;
        const walkId = generateId();
        const waterId = generateId();
        const seedHabits: Habit[] = [
          {
            id: walkId,
            title: 'Morning walk',
            type: 'BUILD',
            frequency: 'DAILY',
            icon: 'walk',
            color: 'amber',
            archived: false,
            createdAt: isoDaysAgo(14),
          },
          {
            id: waterId,
            title: 'Drink 8 glasses of water',
            type: 'BUILD',
            frequency: 'DAILY',
            icon: 'droplet',
            color: 'teal',
            archived: false,
            createdAt: isoDaysAgo(14),
          },
        ];
        const seedLogs: HabitLog[] = [];
        for (let i = 1; i <= 10; i++) {
          seedLogs.push({ id: generateId(), habitId: walkId, date: isoDaysAgo(i), completed: i !== 3 });
          seedLogs.push({ id: generateId(), habitId: waterId, date: isoDaysAgo(i), completed: true });
        }
        set({
          habits: seedHabits,
          logs: seedLogs,
          challenges: [{ id: generateId(), habitId: walkId, durationDays: 21, startDate: isoDaysAgo(13), status: 'ACTIVE' }],
          hasSeeded: true,
        });
      },

      addHabit: (input) => {
        const habit: Habit = { ...input, id: generateId(), archived: false, createdAt: todayIso() };
        set((state) => ({ habits: [...state.habits, habit] }));
        return habit;
      },

      updateHabit: (id, input) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...input } : h)),
        }));
      },

      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, archived: true } : h)),
        }));
      },

      startChallenge: (habitId, durationDays) => {
        set((state) => ({
          challenges: [
            ...state.challenges.filter((c) => !(c.habitId === habitId && c.status === 'ACTIVE')),
            { id: generateId(), habitId, durationDays, startDate: todayIso(), status: 'ACTIVE' },
          ],
        }));
      },

      toggleCheckIn: (habitId, date) => {
        set((state) => {
          const existing = state.logs.find((l) => l.habitId === habitId && l.date === date);
          if (existing) {
            return {
              logs: state.logs.map((l) => (l.id === existing.id ? { ...l, completed: !l.completed } : l)),
            };
          }
          return { logs: [...state.logs, { id: generateId(), habitId, date, completed: true }] };
        });
      },

      isDoneOn: (habitId, date) => {
        const log = get().logs.find((l) => l.habitId === habitId && l.date === date);
        return log?.completed ?? false;
      },

      activeChallenge: (habitId) => {
        const challenge = get().challenges.find((c) => c.habitId === habitId && c.status === 'ACTIVE');
        if (!challenge) return null;
        const dayNumber = Math.min(
          challenge.durationDays,
          Math.max(
            1,
            Math.floor((Date.parse(todayIso()) - Date.parse(challenge.startDate)) / 86400000) + 1,
          ),
        );
        return { ...challenge, dayNumber };
      },

      completedDates: (habitId) => {
        return new Set(get().logs.filter((l) => l.habitId === habitId && l.completed).map((l) => l.date));
      },

      stats: (habitId) => {
        const logs = get()
          .logs.filter((l) => l.habitId === habitId)
          .sort((a, b) => (a.date < b.date ? 1 : -1)); // desc

        const completedCount = logs.filter((l) => l.completed).length;
        const completionRate = logs.length ? Math.round((completedCount * 1000) / logs.length) / 10 : 0;

        let currentStreak = 0;
        let expected = todayIso();
        for (const log of logs) {
          if (!log.completed) break;
          if (log.date === expected) {
            currentStreak++;
            expected = isoDaysAgo(currentStreak);
          } else if (currentStreak === 0 && log.date === isoDaysAgo(1)) {
            currentStreak++;
            expected = isoDaysAgo(2);
          } else {
            break;
          }
        }

        let longestStreak = 0;
        let running = 0;
        let previous: string | null = null;
        for (const log of [...logs].reverse()) {
          if (!log.completed) {
            running = 0;
            previous = null;
            continue;
          }
          if (previous) {
            const prevDate = new Date(previous);
            prevDate.setDate(prevDate.getDate() + 1);
            const expectedDate = prevDate.toISOString().slice(0, 10);
            running = log.date === expectedDate ? running + 1 : 1;
          } else {
            running = 1;
          }
          longestStreak = Math.max(longestStreak, running);
          previous = log.date;
        }

        return { currentStreak, longestStreak, completionRate };
      },
    }),
    {
      name: 'habittracker.local-data',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        habits: state.habits,
        logs: state.logs,
        challenges: state.challenges,
        hasSeeded: state.hasSeeded,
      }),
    },
  ),
);
