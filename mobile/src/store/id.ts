export function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** yyyy-mm-dd in the device's own timezone — a "day" here is the user's day, not UTC's. */
export function toIso(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function todayIso(): string {
  return toIso(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function daysBetween(fromIso: string, toIsoDate: string): number {
  const from = new Date(`${fromIso}T00:00:00`).getTime();
  const to = new Date(`${toIsoDate}T00:00:00`).getTime();
  return Math.round((to - from) / 86400000);
}

/** "22:00" -> "10:00 PM" */
export function formatTime(hhmm: string): string {
  const [hour, minute] = hhmm.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${String(minute).padStart(2, '0')} ${suffix}`;
}

/**
 * RFC 4122 v4 id. The backend accepts client-chosen ids, so a challenge created offline keeps
 * the same id once it syncs — no local-id-to-server-id mapping to maintain.
 */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
