'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { challengesApi, formatTime, todayIso, type Challenge } from '@/lib/challenges';
import { ProgressBar } from '@/components/challenge-visuals';
import { PlusIcon } from '@/components/icons';

export default function ChallengesPage() {
  const { data: challenges, isLoading } = useQuery({ queryKey: ['challenges'], queryFn: challengesApi.list });
  const today = todayIso();

  const { running, finished } = useMemo(() => {
    const isRunning = (challenge: Challenge) => challenge.status === 'ACTIVE' && challenge.endDate >= today;
    return {
      running: (challenges ?? []).filter(isRunning),
      finished: (challenges ?? []).filter((challenge) => !isRunning(challenge)),
    };
  }, [challenges, today]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Challenges</h1>
        <Link
          href="/challenges/new"
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-accent-ink"
        >
          <PlusIcon className="h-4 w-4" />
          New
        </Link>
      </div>

      {isLoading && <p className="text-sm text-text-muted">Loading…</p>}

      {!isLoading && (challenges ?? []).length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-text-muted">
          Nothing yet.{' '}
          <Link href="/challenges/new" className="font-bold text-accent">
            Set up your first challenge
          </Link>
          .
        </div>
      )}

      {running.length > 0 && <SectionLabel text="Running" />}
      {running.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}

      {finished.length > 0 && <SectionLabel text="Finished" />}
      {finished.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <p className="mt-2 text-xs font-bold uppercase tracking-wide text-text-muted">{text}</p>;
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { data: report } = useQuery({
    queryKey: ['report', challenge.id],
    queryFn: () => challengesApi.report(challenge.id),
  });

  const isRunning = challenge.status === 'ACTIVE' && challenge.endDate >= todayIso();
  const elapsedPct = report ? Math.round((report.daysElapsed / challenge.durationDays) * 100) : 0;

  return (
    <Link
      href={`/challenges/${challenge.id}`}
      className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent"
    >
      <div className="flex items-center gap-3">
        <h2 className="flex-1 truncate font-display text-base">{challenge.title}</h2>
        <span className="text-sm font-bold tabular-nums text-accent">{report?.averagePercent ?? 0}%</span>
      </div>
      <p className="mt-0.5 text-[13px] text-text-muted">
        {isRunning
          ? `Day ${challenge.dayNumber} of ${challenge.durationDays} · reminder ${formatTime(challenge.reminderTime)}`
          : `${challenge.status === 'ABANDONED' ? 'Abandoned' : 'Completed'} · ${challenge.durationDays} days`}
      </p>
      <div className="mt-3">
        <ProgressBar value={elapsedPct} />
      </div>
      <p className="mt-2 text-xs text-text-muted">
        {report?.perfectDays ?? 0} perfect · {report?.daysMissed ?? 0} not logged
      </p>
    </Link>
  );
}
