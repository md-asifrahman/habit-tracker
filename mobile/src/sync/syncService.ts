import { create } from 'zustand';
import { challengesApi, type RemoteChallenge, type RemoteDayLog } from '../api/challenges';
import { isBackendConfigured } from '../api/client';
import { normalizeSound } from '../notifications/reminders';
import { useChallengesStore } from '../store/challengesStore';
import { useSessionStore } from '../store/sessionStore';
import { uuid } from '../store/id';
import type { Challenge, DayLog } from '../store/types';

/**
 * Two-way sync with the backend, for signed-in users only.
 *
 * The device is always the app's source of truth — every screen reads local state, so the app
 * works with no network and no account at all. Sync is a background reconcile on top of that:
 * whichever side has the newer `updatedAt` wins, per challenge and per day log. Ids are minted
 * on the device and accepted by the server, so nothing needs remapping.
 *
 * Any network failure is reported as "offline" and changes nothing locally — the next sync
 * picks up where this one left off.
 */

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'signed-out';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  error: string | null;
  syncNow: () => Promise<SyncStatus>;
}

/** "22:00:00" or "22:00" -> "22:00" */
function toHhMm(time: string): string {
  return time.slice(0, 5);
}

function fromRemote(remote: RemoteChallenge, existing?: Challenge): Challenge {
  return {
    id: remote.id,
    title: remote.title,
    durationDays: remote.durationDays,
    startDate: remote.startDate,
    endDate: remote.endDate,
    status: remote.status,
    reminderTime: toHhMm(remote.reminderTime),
    reminderSound: normalizeSound(remote.reminderSound),
    repeatEnabled: remote.repeatEnabled,
    repeatEveryMin: remote.repeatEveryMin,
    tasks: [...remote.tasks]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((task) => ({ id: task.id, title: task.title })),
    // Scheduled notification ids are per-device and never come from the server.
    notificationIds: existing?.notificationIds ?? [],
    updatedAt: remote.updatedAt,
  };
}

function toRemote(challenge: Challenge) {
  return {
    title: challenge.title,
    durationDays: challenge.durationDays,
    startDate: challenge.startDate,
    status: challenge.status,
    reminderTime: challenge.reminderTime,
    reminderSound: normalizeSound(challenge.reminderSound),
    repeatEnabled: challenge.repeatEnabled,
    repeatEveryMin: challenge.repeatEveryMin,
    tasks: challenge.tasks.map((task) => ({ id: task.id, title: task.title })),
  };
}

function logFromRemote(challengeId: string, remote: RemoteDayLog, existingId?: string): DayLog {
  return {
    id: existingId ?? remote.id ?? uuid(),
    challengeId,
    date: remote.date,
    completedTaskIds: remote.completedTaskIds,
    completionPercent: remote.completionPercent,
    taskCount: remote.taskCount,
    updatedAt: remote.updatedAt,
  };
}

function isNewer(a: string, b: string): boolean {
  return Date.parse(a) > Date.parse(b);
}

let inFlight: Promise<SyncStatus> | null = null;

export const useSyncStore = create<SyncState>()((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,

  syncNow: async () => {
    if (inFlight) return inFlight;

    if (!isBackendConfigured() || !useSessionStore.getState().session) {
      set({ status: 'signed-out', error: null });
      return 'signed-out';
    }

    set({ status: 'syncing', error: null });
    inFlight = (async (): Promise<SyncStatus> => {
      const store = useChallengesStore.getState();
      try {
        // 1. Push deletions made on this device before pulling, so they don't come back.
        const tombstones = [...store.deletedIds];
        for (const id of tombstones) {
          await challengesApi.remove(id).catch((error) => {
            // A 404 means the server already doesn't have it — that's a success for our purposes.
            if (!String(error?.message ?? '').includes('not found')) throw error;
          });
        }
        if (tombstones.length) store.clearTombstones(tombstones);

        // 2. Reconcile challenges, newest-edit-wins.
        const remoteList = await challengesApi.list();
        const remoteById = new Map(remoteList.map((challenge) => [challenge.id, challenge]));
        const local = useChallengesStore.getState();
        const mergedChallenges: Challenge[] = [];

        for (const challenge of local.challenges) {
          const remote = remoteById.get(challenge.id);
          if (!remote || isNewer(challenge.updatedAt, remote.updatedAt)) {
            const saved = await challengesApi.upsert(challenge.id, toRemote(challenge));
            mergedChallenges.push(fromRemote(saved, challenge));
          } else {
            mergedChallenges.push(fromRemote(remote, challenge));
          }
          remoteById.delete(challenge.id);
        }
        // Whatever is left came from another device or the website.
        for (const remote of remoteById.values()) {
          mergedChallenges.push(fromRemote(remote));
        }

        // 3. Reconcile each challenge's day logs the same way.
        const mergedLogs: DayLog[] = [];
        for (const challenge of mergedChallenges) {
          const localLogs = local.logs.filter((log) => log.challengeId === challenge.id);
          const remoteLogs = await challengesApi.logs(challenge.id);
          const remoteByDate = new Map(remoteLogs.map((log) => [log.date, log]));

          for (const log of localLogs) {
            const remote = remoteByDate.get(log.date);
            if (!remote || isNewer(log.updatedAt, remote.updatedAt)) {
              const saved = await challengesApi.logDay(challenge.id, log.date, log.completedTaskIds);
              mergedLogs.push(logFromRemote(challenge.id, saved, log.id));
            } else {
              mergedLogs.push(logFromRemote(challenge.id, remote, log.id));
            }
            remoteByDate.delete(log.date);
          }
          for (const remote of remoteByDate.values()) {
            mergedLogs.push(logFromRemote(challenge.id, remote));
          }
        }

        useChallengesStore.getState().applyMerge({ challenges: mergedChallenges, logs: mergedLogs });
        // Adopted challenges may have new reminder settings, so re-arm notifications.
        await useChallengesStore.getState().syncAllReminders();

        set({ status: 'synced', lastSyncedAt: new Date().toISOString(), error: null });
        return 'synced';
      } catch (error) {
        // No network, server down, expired token — all the same to the user: keep working locally.
        set({ status: 'offline', error: error instanceof Error ? error.message : 'Sync failed' });
        return 'offline';
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },
}));

/** Fire-and-forget sync used after local edits; never rejects. */
export function syncInBackground(): void {
  void useSyncStore.getState().syncNow();
}
