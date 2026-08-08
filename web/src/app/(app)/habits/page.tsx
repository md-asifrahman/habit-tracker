'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { habitsApi } from '@/lib/habits';
import { HabitIconBubble } from '@/components/habit-visuals';
import { PlusIcon } from '@/components/icons';

export default function HabitsPage() {
  const { data: habits, isLoading } = useQuery({ queryKey: ['habits'], queryFn: habitsApi.list });

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">All habits</h1>
        <Link
          href="/habits/new"
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink"
        >
          <PlusIcon className="h-4 w-4" />
          New habit
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : !habits || habits.length === 0 ? (
        <p className="text-sm text-text-muted">No habits yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {habits.map((habit) => (
            <Link
              key={habit.id}
              href={`/habits/${habit.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5"
            >
              <HabitIconBubble icon={habit.icon} color={habit.color} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{habit.title}</p>
                <p className="text-xs text-text-muted">
                  {habit.type === 'BUILD' ? 'Build' : 'Break'} · {habit.frequency.toLowerCase()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
