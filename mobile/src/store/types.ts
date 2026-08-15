export type ChallengeStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';

export interface ChallengeTask {
  id: string;
  title: string;
}

export interface Challenge {
  id: string;
  title: string;
  durationDays: number;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  status: ChallengeStatus;
  reminderTime: string; // HH:mm, 24h
  reminderSound: SoundKey;
  repeatEnabled: boolean;
  repeatEveryMin: number;
  tasks: ChallengeTask[];
  /** ISO day-of-week numbers (1=Mon .. 7=Sun) the challenge takes off. */
  restDays: number[];
  /** Ids of the scheduled local notifications, so they can be cancelled on edit/delete. */
  notificationIds: string[];
  /** ISO instant of the last local edit — the tie-breaker when syncing with the server. */
  updatedAt: string;
}

/** One day of a challenge. Partial completion is the point — it's stored as a percentage. */
export interface DayLog {
  id: string;
  challengeId: string;
  date: string; // yyyy-mm-dd
  completedTaskIds: string[];
  completionPercent: number; // 0-100, snapshotted at save time
  taskCount: number;
  note?: string;
  /** ISO instant of the last local edit — the tie-breaker when syncing with the server. */
  updatedAt: string;
}

/** The phone's own notification sound, or none at all. */
export type SoundKey = 'default' | 'silent';

export interface DayCell {
  dayNumber: number;
  date: string;
  completionPercent: number;
  logged: boolean;
  future: boolean;
  /** A planned day off: no reminder, and excluded from every figure in the report. */
  restDay: boolean;
}

export interface TaskBreakdown {
  taskId: string;
  title: string;
  completedDays: number;
  elapsedDays: number;
  percent: number;
}

export interface ChallengeReport {
  daysElapsed: number;
  daysLogged: number;
  daysMissed: number;
  perfectDays: number;
  averagePercent: number;
  bestStreak: number;
  days: DayCell[];
  taskBreakdown: TaskBreakdown[];
}
