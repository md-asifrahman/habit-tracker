'use client';

import { useMemo, useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { challengesApi, formatTime, todayIso, type Challenge, type DayLog } from '@/lib/challenges';
import { ProgressBar, RingProgress } from '@/components/challenge-visuals';
import { CheckIcon, PlusIcon } from '@/components/icons';

export default function TodayPage() {
  const { session } = useAuth();
  const today = todayIso();

  const { data: challenges, isLoading } = useQuery({ queryKey: ['challenges'], queryFn: challengesApi.list });
  const active = useMemo(
    () => (challenges ?? []).filter((challenge) => challenge.status === 'ACTIVE' && challenge.endDate >= today),
    [challenges, today],
  );

  const logQueries = useQueries({
    queries: active.map((challenge) => ({
      queryKey: ['logs', challenge.id],
      queryFn: () => challengesApi.logs(challenge.id),
    })),
  });

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Good day, {session?.name?.split(' ')[0] ?? 'there'}</h1>
          <p className="text-sm text-text-muted">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/challenges/new"
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink"
        >
          <PlusIcon className="h-4 w-4" />
          New challenge
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-text-muted">
          No challenge running.{' '}
          <Link href="/challenges/new" className="font-bold text-accent">
            Start one
          </Link>
          .
        </div>
      ) : (
        active.map((challenge, index) => {
          const savedLog = logQueries[index]?.data?.find((log) => log.date === today) ?? null;
          return (
            // Keyed on the saved log so a fresh save re-seeds the checkbox state from the server.
            <TodayCard
              key={`${challenge.id}:${savedLog?.id ?? 'unlogged'}:${today}`}
              challenge={challenge}
              savedLog={savedLog}
            />
          );
        })
      )}
    </div>
  );
}

function TodayCard({ challenge, savedLog }: { challenge: Challenge; savedLog: DayLog | null }) {
  const queryClient = useQueryClient();
  const today = todayIso();
  const [checked, setChecked] = useState<string[]>(savedLog?.completedTaskIds ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const total = challenge.tasks.length;
  const done = checked.length;
  const pct = total === 0 ? 0 : Math.round((done * 100) / total);
  const allChecked = total > 0 && done === total;
  const dirty = !savedLog || !sameSet(checked, savedLog.completedTaskIds);

  function toggle(taskId: string) {
    setChecked((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  }

  async function save() {
    setIsSaving(true);
    try {
      await challengesApi.logDay(challenge.id, today, checked);
      queryClient.invalidateQueries({ queryKey: ['logs', challenge.id] });
      queryClient.invalidateQueries({ queryKey: ['report', challenge.id] });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <Link href={`/challenges/${challenge.id}`} className="font-display text-lg hover:text-accent">
            {challenge.title}
          </Link>
          <p className="text-[13px] text-text-muted">
            Day {challenge.dayNumber} of {challenge.durationDays} · reminder {formatTime(challenge.reminderTime)}
          </p>
        </div>
        <RingProgress value={pct / 100} size={56} strokeWidth={6}>
          <span className="font-display text-[13px] tabular-nums">{pct}%</span>
        </RingProgress>
      </div>

      <ul className="mt-4 flex flex-col">
        {challenge.tasks.map((task) => {
          const on = checked.includes(task.id);
          return (
            <li key={task.id}>
              <button
                onClick={() => toggle(task.id)}
                className="flex w-full items-center gap-2.5 py-2 text-left"
              >
                <Checkbox on={on} tone="success" />
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
        <Checkbox on={allChecked} tone="accent" />
        <span className="flex-1 text-[13px] font-bold">Select all</span>
        <span className="text-[13px] tabular-nums text-text-muted">
          {done}/{total}
        </span>
      </button>

      <div className="mt-3">
        <ProgressBar value={pct} />
      </div>

      <button
        onClick={save}
        disabled={!dirty || isSaving}
        className="mt-4 w-full rounded-xl py-3 text-sm font-bold disabled:cursor-default"
        style={{
          background: dirty ? 'var(--accent)' : 'var(--surface-2)',
          color: dirty ? 'var(--accent-ink)' : 'var(--text-muted)',
        }}
      >
        {isSaving ? 'Saving…' : dirty ? `Save today — ${pct}%` : `Saved · ${pct}%`}
      </button>
    </div>
  );
}

function Checkbox({ on, tone }: { on: boolean; tone: 'success' | 'accent' }) {
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

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}
