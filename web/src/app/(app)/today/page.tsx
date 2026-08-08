'use client';

import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { habitsApi } from '@/lib/habits';
import { HabitIconBubble, RingProgress } from '@/components/habit-visuals';
import { CheckIcon, PlusIcon } from '@/components/icons';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const today = todayIso();

  const { data: habits, isLoading } = useQuery({ queryKey: ['habits'], queryFn: habitsApi.list });

  const checkInQueries = useQueries({
    queries: (habits ?? []).map((habit) => ({
      queryKey: ['checkins', habit.id],
      queryFn: () => habitsApi.checkIns(habit.id),
      enabled: !!habits,
    })),
  });

  const doneToday = new Map<string, boolean>();
  checkInQueries.forEach((q, i) => {
    const habit = habits?.[i];
    if (habit && q.data) {
      doneToday.set(habit.id, q.data.some((c) => c.date === today && c.completed));
    }
  });

  async function toggle(habitId: string) {
    const isDone = doneToday.get(habitId) ?? false;
    await habitsApi.checkIn(habitId, today, !isDone);
    queryClient.invalidateQueries({ queryKey: ['checkins', habitId] });
  }

  const doneCount = habits ? habits.filter((h) => doneToday.get(h.id)).length : 0;
  const total = habits?.length ?? 0;

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
          href="/habits/new"
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink"
        >
          <PlusIcon className="h-4 w-4" />
          New habit
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading habits…</p>
      ) : total === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-text-muted">
          No habits yet.{' '}
          <Link href="/habits/new" className="font-bold text-accent">
            Add your first one
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4.5">
            <RingProgress value={total ? doneCount / total : 0} size={64}>
              <span className="font-display text-[15px] tabular-nums">
                {doneCount}/{total}
              </span>
            </RingProgress>
            <div>
              <p className="text-sm font-bold">
                {doneCount} of {total} habits done
              </p>
              <p className="text-[13px] text-text-muted">
                {total - doneCount === 0 ? 'All done for today' : `${total - doneCount} left — keep going`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {habits!.map((habit) => {
              const done = doneToday.get(habit.id) ?? false;
              return (
                <div key={habit.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5">
                  <Link href={`/habits/${habit.id}`} className="flex flex-1 items-center gap-3 overflow-hidden">
                    <HabitIconBubble icon={habit.icon} color={habit.color} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{habit.title}</p>
                      <p className="text-xs text-text-muted">{habit.type === 'BUILD' ? 'Build' : 'Break'} · {habit.frequency.toLowerCase()}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggle(habit.id)}
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full border-[1.8px]"
                    style={{
                      borderColor: done ? 'var(--success)' : 'var(--border)',
                      background: done ? 'var(--success)' : 'transparent',
                      color: '#fff',
                    }}
                    aria-label={done ? 'Mark not done' : 'Mark done'}
                  >
                    {done && <CheckIcon className="h-3.5 w-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
