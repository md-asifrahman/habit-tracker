import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Challenge, SoundKey } from '../store/types';

/**
 * Reminders are entirely on-device. Each challenge gets:
 *   - one repeating daily notification at its reminder time, and
 *   - follow-up "you haven't logged today" nags spaced `repeatEveryMin` apart, scheduled as
 *     one-off date triggers for the next few unlogged days.
 *
 * Expo has no "repeat until dismissed" trigger, so the nags are armed per-day and any day that
 * gets logged has its remaining nags dropped. Everything is re-armed by `syncReminders`.
 */

export interface SoundOption {
  key: SoundKey;
  label: string;
  hint: string;
}

/**
 * We use the phone's own notification sound rather than shipping audio files. It's the sound the
 * user already chose for their device, it needs no dev build to work, and it respects Do Not
 * Disturb and per-app sound settings the way people expect.
 */
export const SOUND_OPTIONS: SoundOption[] = [
  { key: 'default', label: 'Device default', hint: 'Your phone’s notification sound' },
  { key: 'silent', label: 'Silent', hint: 'Show the reminder without a sound' },
];

/** Older records (and other clients) may carry sound names we no longer offer. */
export function normalizeSound(value: string | null | undefined): SoundKey {
  return value === 'silent' ? 'silent' : 'default';
}

export function soundLabel(key: SoundKey): string {
  return SOUND_OPTIONS.find((option) => option.key === key)?.label ?? 'Device default';
}

/** Follow-up nags per day, and how many days ahead they're armed for. */
const MAX_REPEATS = 4;
const ARM_DAYS_AHEAD = 7;

Notifications.setNotificationHandler({
  // Also applies while the app is open, so a silent reminder stays silent there too.
  handleNotification: async (notification) => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: notification.request.content.data?.silent !== true,
    shouldSetBadge: false,
  }),
});

const CHANNEL_AUDIBLE = 'reminders';
const CHANNEL_SILENT = 'reminders-silent';

export async function ensurePermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (Platform.OS === 'android') {
    // On Android 8+ the sound belongs to the channel, not the notification — so "silent" has to
    // be a channel of its own. (A channel's sound also can't be changed after it's created.)
    await Notifications.setNotificationChannelAsync(CHANNEL_AUDIBLE, {
      name: 'Challenge reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync(CHANNEL_SILENT, {
      name: 'Challenge reminders (silent)',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });
  }
  return status === 'granted';
}

/** iOS takes the sound per notification; Android takes it from the channel. Set both. */
function soundFor(key: SoundKey): string | undefined {
  return normalizeSound(key) === 'silent' ? undefined : 'default';
}

function channelFor(key: SoundKey): string {
  return normalizeSound(key) === 'silent' ? CHANNEL_SILENT : CHANNEL_AUDIBLE;
}

export async function cancelReminders(notificationIds: string[]): Promise<void> {
  await Promise.all(
    notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)),
  );
}

/**
 * Cancels a challenge's existing reminders and schedules a fresh set, skipping days already
 * logged. Returns the new notification ids to store on the challenge.
 */
export async function syncReminders(challenge: Challenge, loggedDates: Set<string>): Promise<string[]> {
  await cancelReminders(challenge.notificationIds);

  if (challenge.status !== 'ACTIVE') return [];
  const granted = await ensurePermissions();
  if (!granted) return [];

  const [hour, minute] = challenge.reminderTime.split(':').map(Number);
  const sound = soundFor(challenge.reminderSound);
  const channelId = channelFor(challenge.reminderSound);
  const restDays = challenge.restDays ?? [];
  const ids: string[] = [];

  const content = {
    title: challenge.title,
    body: "Time to tick off today's list.",
    sound,
    data: { challengeId: challenge.id, silent: sound === undefined },
  };

  // The dependable part: a repeating trigger that keeps firing without the app being opened.
  if (restDays.length === 0) {
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId,
        },
      }),
    );
  } else {
    // A daily trigger can't skip days, so each active weekday gets its own weekly trigger.
    for (let isoDay = 1; isoDay <= 7; isoDay++) {
      if (restDays.includes(isoDay)) continue;
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: expoWeekday(isoDay),
            hour,
            minute,
            channelId,
          },
        }),
      );
    }
  }

  if (!challenge.repeatEnabled) return ids;

  const now = new Date();
  for (let dayOffset = 0; dayOffset < ARM_DAYS_AHEAD; dayOffset++) {
    const day = new Date();
    day.setDate(day.getDate() + dayOffset);
    const iso = toIso(day);
    if (iso > challenge.endDate) break;
    if (iso < challenge.startDate || loggedDates.has(iso)) continue;
    if (restDays.includes(isoWeekdayOf(day))) continue; // no nagging on a planned day off

    for (let repeat = 1; repeat <= MAX_REPEATS; repeat++) {
      const total = hour * 60 + minute + repeat * challenge.repeatEveryMin;
      if (total >= 24 * 60) break; // past midnight the day it belongs to is over

      const fireAt = new Date(day);
      fireAt.setHours(Math.floor(total / 60), total % 60, 0, 0);
      if (fireAt <= now) continue;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Still open: ${challenge.title}`,
          body: "You haven't logged today yet.",
          sound,
          data: { challengeId: challenge.id, silent: sound === undefined },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireAt,
          channelId,
        },
      });
      ids.push(id);
    }
  }

  return ids;
}

/** Expo counts weekdays from Sunday (1); we store ISO weekdays from Monday (1). */
function expoWeekday(isoDay: number): number {
  return (isoDay % 7) + 1;
}

/** ISO day of week for a Date: 1 = Monday .. 7 = Sunday. */
function isoWeekdayOf(date: Date): number {
  const day = date.getDay(); // 0 = Sunday
  return day === 0 ? 7 : day;
}

function toIso(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}
