'use client';

import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { challengesApi, formatTime, soundLabel, todayIso } from '@/lib/challenges';
import { DayStrip, ProgressBar, RingProgress, StatTile } from '@/components/challenge-visuals';
import { BackIcon } from '@/components/icons';

export default function ChallengeReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: challenge } = useQuery({ queryKey: ['challenge', id], queryFn: () => challengesApi.get(id) });
  const { data: report, isLoading } = useQuery({ queryKey: ['report', id], queryFn: () => challengesApi.report(id) });

  if (isLoading || !challenge || !report) {
    return <p className="p-8 text-sm text-text-muted">Loading…</p>;
  }

  const isRunning = challenge.status === 'ACTIVE' && challenge.endDate >= todayIso();

  async function end() {
    await challengesApi.abandon(id);
    queryClient.invalidateQueries({ queryKey: ['challenge', id] });
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
  }

  async function remove() {
    if (!window.confirm('Delete this challenge and all its day logs?')) return;
    await challengesApi.remove(id);
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    router.push('/challenges');
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-8">
      <Link href="/challenges" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
        <BackIcon className="h-3.5 w-3.5" />
        Challenges
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="flex-1 font-display text-2xl">{challenge.title}</h1>
        <Link
          href={`/challenges/${id}/edit`}
          className="rounded-xl border border-border px-4 py-2 text-[13px] font-bold"
        >
          Edit
        </Link>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5">
        <RingProgress value={report.averagePercent / 100} size={80} strokeWidth={9}>
          <span className="font-display text-base tabular-nums">{report.averagePercent}%</span>
        </RingProgress>
        <div>
          <p className="text-sm font-bold">Average completion</p>
          <p className="text-[13px] text-text-muted">
            across {report.daysElapsed} day{report.daysElapsed === 1 ? '' : 's'} so far
            <br />
            {challenge.startDate} → {challenge.endDate}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <StatTile label="Perfect days" value={report.perfectDays} />
        <StatTile label="Best streak" value={report.bestStreak} />
        <StatTile label="Not logged" value={report.daysMissed} />
      </div>

      <Section title="Day by day">
        <DayStrip days={report.days} />
        <p className="mt-3 text-xs text-text-muted">
          Darker means more of the list got done. Outlined squares are still ahead.
        </p>
      </Section>

      <Section title="Task breakdown">
        <div className="flex flex-col gap-3.5">
          {report.taskBreakdown.map((task) => (
            <div key={task.taskId}>
              <div className="flex items-center gap-3">
                <span className="flex-1 truncate text-[13px]">{task.title}</span>
                <span className="text-xs font-bold tabular-nums text-text-muted">
                  {task.completedDays}/{task.elapsedDays}
                </span>
              </div>
              <div className="mt-1.5">
                <ProgressBar value={task.percent} color="var(--teal)" />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Reminder">
        <p className="text-[13px] leading-6">
          {formatTime(challenge.reminderTime)} · {soundLabel(challenge.reminderSound)}
          <br />
          {challenge.repeatEnabled
            ? `Repeats every ${challenge.repeatEveryMin} min until the day is logged`
            : 'No repeat if missed'}
          <br />
          <span className="text-text-muted">Reminders fire on the phone app.</span>
        </p>
      </Section>

      <div className="flex gap-3">
        {isRunning && (
          <button onClick={end} className="flex-1 rounded-xl border border-border py-3 text-sm font-bold">
            End challenge
          </button>
        )}
        <button onClick={remove} className="flex-1 rounded-xl border border-border py-3 text-sm font-bold text-danger">
          Delete
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-display text-[15px]">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
