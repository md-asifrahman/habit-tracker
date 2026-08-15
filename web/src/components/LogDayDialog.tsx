'use client';

import { useState } from 'react';
import { challengesApi, type Challenge, type DayLog } from '@/lib/challenges';
import { CheckIcon } from '@/components/icons';

/**
 * Filling in a day that was missed, or correcting one already logged. Without this a forgotten
 * night is permanently 0% with no way to fix it.
 */
export function LogDayDialog({
  challenge,
  date,
  existing,
  onClose,
  onSaved,
}: {
  challenge: Challenge;
  date: string;
  existing: DayLog | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [checked, setChecked] = useState<string[]>(existing?.completedTaskIds ?? []);
  const [note, setNote] = useState(existing?.note ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = challenge.tasks.length;
  const pct = total === 0 ? 0 : Math.round((checked.length * 100) / total);
  const allChecked = total > 0 && checked.length === total;

  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  async function save() {
    setIsSaving(true);
    setError(null);
    try {
      await challengesApi.logDay(challenge.id, date, checked, note.trim() || undefined);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that day');
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg">{dateLabel}</h2>
            <p className="text-[13px] text-text-muted">{challenge.title}</p>
          </div>
          <button onClick={onClose} className="text-sm text-text-muted hover:text-text" aria-label="Close">
            ✕
          </button>
        </div>

        <ul className="mt-4 flex flex-col">
          {challenge.tasks.map((task) => {
            const on = checked.includes(task.id);
            return (
              <li key={task.id}>
                <button
                  onClick={() =>
                    setChecked((current) =>
                      current.includes(task.id) ? current.filter((id) => id !== task.id) : [...current, task.id],
                    )
                  }
                  className="flex w-full items-center gap-2.5 py-2 text-left"
                >
                  <Box on={on} tone="success" />
                  <span className={`text-sm ${on ? 'text-text-muted line-through' : ''}`}>{task.title}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          onClick={() => setChecked(allChecked ? [] : challenge.tasks.map((task) => task.id))}
          className="mt-1.5 flex w-full items-center gap-2.5 border-t border-border pt-3 text-left"
        >
          <Box on={allChecked} tone="accent" />
          <span className="flex-1 text-[13px] font-bold">Select all</span>
          <span className="text-[13px] tabular-nums text-text-muted">
            {checked.length}/{total}
          </span>
        </button>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a note (optional)"
          rows={2}
          className="mt-3 w-full resize-y rounded-xl border border-border bg-bg px-3 py-2.5 text-[13.5px] outline-none focus:border-accent"
        />

        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        <button
          onClick={save}
          disabled={isSaving}
          className="mt-4 w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-ink disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : `${existing ? 'Update' : 'Log this day'} — ${pct}%`}
        </button>
      </div>
    </div>
  );
}

function Box({ on, tone }: { on: boolean; tone: 'success' | 'accent' }) {
  const solid = tone === 'success' ? 'var(--success)' : 'var(--accent)';
  return (
    <span
      className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-[1.8px]"
      style={{
        borderColor: on ? solid : 'var(--border)',
        background: on ? solid : 'transparent',
        color: tone === 'success' ? '#fff' : 'var(--accent-ink)',
      }}
    >
      {on && <CheckIcon className="h-3.5 w-3.5" />}
    </span>
  );
}
