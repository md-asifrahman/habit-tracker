'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '@/lib/challenges';
import { ChallengeForm } from '@/components/ChallengeForm';

export default function NewChallengePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <h1 className="font-display text-2xl">New challenge</h1>

      <ChallengeForm
        submitLabel="Start challenge"
        onSubmit={async (values) => {
          const challenge = await challengesApi.create({
            title: values.title,
            durationDays: values.durationDays,
            reminderTime: values.reminderTime,
            reminderSound: values.reminderSound,
            repeatEnabled: values.repeatEnabled,
            repeatEveryMin: values.repeatEveryMin,
            tasks: values.tasks.map((task) => task.title),
          });
          queryClient.invalidateQueries({ queryKey: ['challenges'] });
          router.push(`/challenges/${challenge.id}`);
        }}
      />
    </div>
  );
}
