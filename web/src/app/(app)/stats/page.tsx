'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { habitsApi } from '@/lib/habits';
import { habitColorVars, HabitIconBubble } from '@/components/habit-visuals';

export default function StatsPage() {
  const { data: habits } = useQuery({ queryKey: ['habits'], queryFn: habitsApi.list });

  const statsQueries = useQueries({
    queries: (habits ?? []).map((habit) => ({
      queryKey: ['stats', habit.id],
      queryFn: () => habitsApi.stats(habit.id),
      enabled: !!habits,
    })),
  });

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <h1 className="font-display text-2xl">Stats</h1>

      {!habits || habits.length === 0 ? (
        <p className="text-sm text-text-muted">Add a habit to start seeing stats.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {habits.map((habit, i) => {
            const vars = habitColorVars(habit.color);
            const stats = statsQueries[i]?.data;
            return (
              <div key={habit.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5">
                <HabitIconBubble icon={habit.icon} color={habit.color} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold">{habit.title}</p>
                  <p className="text-xs text-text-muted">{stats?.completionRate ?? 0}% completion</p>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg tabular-nums" style={{ color: vars.solid }}>
                    {stats?.currentStreak ?? 0}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Streak</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
