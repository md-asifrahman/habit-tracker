'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '@/lib/habits';
import { habitColorVars, Heatmap, RingProgress } from '@/components/habit-visuals';
import { BackIcon, CheckIcon } from '@/components/icons';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function HabitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const today = todayIso();

  const { data: habit } = useQuery({ queryKey: ['habit', id], queryFn: () => habitsApi.get(id) });
  const { data: stats } = useQuery({ queryKey: ['stats', id], queryFn: () => habitsApi.stats(id) });
  const { data: challenge } = useQuery({ queryKey: ['challenge', id], queryFn: () => habitsApi.activeChallenge(id) });
  const { data: checkIns } = useQuery({ queryKey: ['checkins', id], queryFn: () => habitsApi.checkIns(id) });

  if (!habit) {
    return <p className="p-8 text-sm text-text-muted">Loading…</p>;
  }

  const vars = habitColorVars(habit.color);
  const doneToday = checkIns?.some((c) => c.date === today && c.completed) ?? false;
  const completedDates = new Set((checkIns ?? []).filter((c) => c.completed).map((c) => c.date));

  async function markDone() {
    await habitsApi.checkIn(id, today, !doneToday);
    queryClient.invalidateQueries({ queryKey: ['checkins', id] });
    queryClient.invalidateQueries({ queryKey: ['stats', id] });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <div className="flex items-center gap-3">
        <Link href="/today" className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface">
          <BackIcon className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 font-display text-xl">{habit.title}</h1>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: vars.solid }} />
      </div>

      {challenge && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-6">
          <RingProgress value={challenge.dayNumber / challenge.durationDays} size={130} strokeWidth={11} color={vars.solid}>
            <div className="flex flex-col items-center">
              <span className="font-display text-4xl tabular-nums">{challenge.dayNumber}</span>
              <span className="text-[11px] font-bold text-text-muted">OF {challenge.durationDays} DAYS</span>
            </div>
          </RingProgress>
          <p className="text-center text-xs text-text-muted">
            {challenge.durationDays}-day challenge · started {new Date(challenge.startDate).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="flex gap-2.5">
        <StatChip label="Streak" value={stats?.currentStreak ?? 0} />
        <StatChip label="Best" value={stats?.longestStreak ?? 0} />
        <StatChip label="Rate" value={`${stats?.completionRate ?? 0}%`} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-text-muted">Last 10 weeks</p>
        <Heatmap dates={completedDates} color={vars.solid} />
      </div>

      <button
        onClick={markDone}
        className="rounded-xl px-4 py-3.5 text-sm font-bold flex items-center justify-center gap-2"
        style={{ background: vars.solid, color: '#fff' }}
      >
        <CheckIcon className="h-4 w-4" />
        {doneToday ? "Done today — tap to undo" : 'Mark today done'}
      </button>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface px-3 py-3 text-center">
      <div className="font-display text-xl tabular-nums">{value}</div>
      <div className="text-[10.5px] font-bold uppercase tracking-wide text-text-muted">{label}</div>
    </div>
  );
}
