'use client';

import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { challengesApi } from '@/lib/challenges';
import { ChallengeForm } from '@/components/ChallengeForm';
import { BackIcon } from '@/components/icons';

export default function EditChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: challenge, isLoading } = useQuery({
    queryKey: ['challenge', id],
    queryFn: () => challengesApi.get(id),
  });

  if (isLoading || !challenge) {
    return <p className="p-8 text-sm text-text-muted">Loading…</p>;
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <Link href={`/challenges/${id}`} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
        <BackIcon className="h-3.5 w-3.5" />
        Back to report
      </Link>

      <h1 className="font-display text-2xl">Edit challenge</h1>

      <ChallengeForm
        initial={challenge}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await challengesApi.upsert(id, {
            title: values.title,
            // Length and start date are part of the challenge's identity once it's running.
            durationDays: challenge.durationDays,
            startDate: challenge.startDate,
            status: challenge.status,
            reminderTime: values.reminderTime,
            reminderSound: values.reminderSound,
            repeatEnabled: values.repeatEnabled,
            repeatEveryMin: values.repeatEveryMin,
            tasks: values.tasks,
            restDays: values.restDays,
          });
          queryClient.invalidateQueries({ queryKey: ['challenge', id] });
          queryClient.invalidateQueries({ queryKey: ['challenges'] });
          queryClient.invalidateQueries({ queryKey: ['report', id] });
          router.push(`/challenges/${id}`);
        }}
      />
    </div>
  );
}
