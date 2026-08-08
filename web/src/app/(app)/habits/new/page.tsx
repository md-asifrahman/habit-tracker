'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { habitsApi, HabitColor, HabitFrequency, HabitIcon, HabitType } from '@/lib/habits';
import { HABIT_COLOR_OPTIONS, HABIT_ICON_OPTIONS, HabitIconBubble } from '@/components/habit-visuals';
import { BackIcon } from '@/components/icons';

const CHALLENGE_LENGTHS = [21, 66, 100];

export default function NewHabitPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<HabitType>('BUILD');
  const [frequency, setFrequency] = useState<HabitFrequency>('DAILY');
  const [icon, setIcon] = useState<HabitIcon>('leaf');
  const [color, setColor] = useState<HabitColor>('accent');
  const [challengeLength, setChallengeLength] = useState<number | null>(21);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const habit = await habitsApi.create({ title, type, frequency, icon, color });
      if (challengeLength) {
        await habitsApi.startChallenge(habit.id, challengeLength);
      }
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      router.push(`/habits/${habit.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create habit');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <div className="flex items-center gap-3">
        <Link href="/today" className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface">
          <BackIcon className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-xl">New habit</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Name">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Evening yoga"
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-bold outline-none focus:border-accent"
          />
        </Field>

        <Field label="Icon & color">
          <div className="flex flex-wrap gap-2.5">
            {HABIT_COLOR_OPTIONS.map((colorOption) => (
              <button
                type="button"
                key={colorOption}
                onClick={() => setColor(colorOption)}
                className="rounded-full ring-offset-2"
                style={{ boxShadow: color === colorOption ? `0 0 0 2px var(--text)` : undefined }}
              >
                <HabitIconBubble icon={icon} color={colorOption} size={36} />
              </button>
            ))}
          </div>
          <div className="mt-1 flex flex-wrap gap-2.5">
            {HABIT_ICON_OPTIONS.map((iconOption) => (
              <button
                type="button"
                key={iconOption}
                onClick={() => setIcon(iconOption)}
                className="rounded-full"
                style={{ boxShadow: icon === iconOption ? `0 0 0 2px var(--text)` : undefined }}
              >
                <HabitIconBubble icon={iconOption} color={color} size={36} />
              </button>
            ))}
          </div>
        </Field>

        <Field label="Type">
          <div className="flex rounded-xl bg-surface-2 p-1">
            {(['BUILD', 'BREAK'] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg py-2 text-sm font-bold ${
                  type === t ? 'bg-surface text-text' : 'text-text-muted'
                }`}
              >
                {t === 'BUILD' ? 'Build' : 'Break'}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Frequency">
          <ChipRow
            options={[
              { value: 'DAILY', label: 'Daily' },
              { value: 'WEEKLY', label: 'Weekly' },
              { value: 'CUSTOM', label: 'Custom' },
            ]}
            value={frequency}
            onChange={(v) => setFrequency(v as HabitFrequency)}
          />
        </Field>

        <Field label="Challenge length">
          <ChipRow
            options={[
              ...CHALLENGE_LENGTHS.map((d) => ({ value: String(d), label: `${d} days` })),
              { value: 'none', label: 'No challenge' },
            ]}
            value={challengeLength ? String(challengeLength) : 'none'}
            onChange={(v) => setChallengeLength(v === 'none' ? null : Number(v))}
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:opacity-60"
        >
          {isSubmitting ? 'Creating…' : 'Create habit'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="rounded-full border px-3.5 py-2 text-xs font-bold"
          style={
            value === opt.value
              ? { background: 'var(--accent-tint)', borderColor: 'var(--accent)', color: 'var(--accent)' }
              : { borderColor: 'var(--border)', color: 'var(--text-muted)' }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
