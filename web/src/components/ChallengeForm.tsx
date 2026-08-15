'use client';

import { useState } from 'react';
import {
  formatTime,
  normalizeSound,
  restDaysLabel,
  soundLabel,
  SOUND_OPTIONS,
  WEEKDAY_LABELS,
  type Challenge,
  type SoundKey,
} from '@/lib/challenges';
import { CheckIcon, PlusIcon } from '@/components/icons';

const DURATION_PRESETS = [7, 21, 30, 100];
const REPEAT_PRESETS = [15, 30, 60];

type Step = 'setup' | 'tasks' | 'summary';
const STEPS: { key: Step; label: string }[] = [
  { key: 'setup', label: 'Setup' },
  { key: 'tasks', label: 'Daily list' },
  { key: 'summary', label: 'Summary' },
];

/** A task row in the editor. `id` is present for tasks that already exist on the server. */
export interface TaskDraft {
  id?: string;
  title: string;
}

export interface ChallengeFormValues {
  title: string;
  durationDays: number;
  reminderTime: string;
  reminderSound: SoundKey;
  repeatEnabled: boolean;
  repeatEveryMin: number;
  tasks: TaskDraft[];
  restDays: number[];
}

/**
 * The three-step add/edit flow, shared by /challenges/new and /challenges/[id]/edit so both
 * places ask the same questions in the same order and end on the same summary.
 */
export function ChallengeForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Challenge;
  submitLabel: string;
  onSubmit: (values: ChallengeFormValues) => Promise<void>;
}) {
  const [step, setStep] = useState<Step>('setup');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [durationDays, setDurationDays] = useState(initial?.durationDays ?? 21);
  const [reminderTime, setReminderTime] = useState(initial ? initial.reminderTime.slice(0, 5) : '22:00');
  const [reminderSound, setReminderSound] = useState<SoundKey>(normalizeSound(initial?.reminderSound));
  const [repeatEnabled, setRepeatEnabled] = useState(initial?.repeatEnabled ?? true);
  const [repeatEveryMin, setRepeatEveryMin] = useState(initial?.repeatEveryMin ?? 30);
  const [tasks, setTasks] = useState<TaskDraft[]>(
    initial?.tasks.map((task) => ({ id: task.id, title: task.title })) ?? [],
  );
  const [restDays, setRestDays] = useState<number[]>(initial?.restDays ?? []);
  const [taskDraft, setTaskDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // A running challenge can't change length — that would invalidate every day already logged.
  const durationLocked = !!initial;

  const setupValid = title.trim().length > 0 && durationDays >= 1 && restDays.length < 7;
  const tasksValid = tasks.length > 0;

  function addTask() {
    const value = taskDraft.trim();
    if (!value) return;
    setTasks((current) => [...current, { title: value }]);
    setTaskDraft('');
  }

  function moveTask(index: number, direction: -1 | 1) {
    setTasks((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function submit() {
    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        durationDays,
        reminderTime,
        reminderSound,
        repeatEnabled,
        repeatEveryMin,
        tasks,
        restDays,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the challenge');
      setIsSaving(false);
    }
  }

  return (
    <>
      <ol className="flex gap-2 text-xs font-bold">
        {STEPS.map((candidate, index) => (
          <li
            key={candidate.key}
            className={`rounded-full px-3 py-1.5 ${
              candidate.key === step ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-text-muted'
            }`}
          >
            {index + 1}. {candidate.label}
          </li>
        ))}
      </ol>

      {step === 'setup' && (
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-6">
          <Field label="What are you calling it?">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. 21-day reset"
              className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </Field>

          <Field label="How many days?">
            {durationLocked ? (
              <p className="text-sm">
                {durationDays} days
                <span className="ml-2 text-xs text-text-muted">
                  — fixed once the challenge has started
                </span>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <Chip
                    key={preset}
                    label={`${preset} days`}
                    selected={durationDays === preset}
                    onClick={() => setDurationDays(preset)}
                  />
                ))}
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(event) => setDurationDays(Number(event.target.value))}
                  className="w-28 rounded-full border border-border bg-bg px-3.5 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
            )}
          </Field>

          <Field label="Rest days">
            <p className="mb-2.5 text-xs text-text-muted">
              Days you plan to take off. No reminder, and they never count against you.
            </p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((day) => {
                const off = restDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    onClick={() =>
                      setRestDays((current) =>
                        off ? current.filter((v) => v !== day.value) : [...current, day.value],
                      )
                    }
                    className="min-w-12 rounded-xl border px-3 py-2 text-[12.5px] font-bold"
                    style={{
                      background: off ? 'var(--accent)' : 'var(--bg)',
                      borderColor: off ? 'var(--accent)' : 'var(--border)',
                      color: off ? 'var(--accent-ink)' : 'var(--text)',
                    }}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
            {restDays.length >= 7 && (
              <p className="mt-2 text-xs text-danger">
                Every day can&apos;t be a rest day — leave at least one active.
              </p>
            )}
          </Field>

          <Field label="Daily reminder">
            <input
              type="time"
              value={reminderTime}
              onChange={(event) => setReminderTime(event.target.value)}
              className="rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
          </Field>

          <Field label="Reminder sound">
            <div className="flex flex-wrap gap-2">
              {SOUND_OPTIONS.map((option) => (
                <Chip
                  key={option.key}
                  label={option.label}
                  selected={reminderSound === option.key}
                  onClick={() => setReminderSound(option.key)}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {SOUND_OPTIONS.find((option) => option.key === reminderSound)?.hint} — reminders play on
              the phone app, not in the browser.
            </p>
          </Field>

          <Field label="Nag me again if I miss it">
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(event) => setRepeatEnabled(event.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Repeat until I log the day
            </label>
            {repeatEnabled && (
              <div className="mt-3 flex flex-wrap gap-2">
                {REPEAT_PRESETS.map((preset) => (
                  <Chip
                    key={preset}
                    label={`every ${preset} min`}
                    selected={repeatEveryMin === preset}
                    onClick={() => setRepeatEveryMin(preset)}
                  />
                ))}
              </div>
            )}
          </Field>
        </div>
      )}

      {step === 'tasks' && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
          <p className="text-[13px] text-text-muted">
            List the things you want to do every single day. You&apos;ll tick these off each night.
            {initial && ' Removing a task also removes it from the days you already logged.'}
          </p>

          <ul className="flex flex-col gap-2">
            {tasks.map((task, index) => (
              <li
                key={task.id ?? `new-${index}`}
                className="flex items-center gap-1 rounded-xl border border-border bg-bg px-3.5 py-2.5"
              >
                <span className="flex-1 text-sm">{task.title}</span>
                <IconButton label="Move up" onClick={() => moveTask(index, -1)}>
                  ↑
                </IconButton>
                <IconButton label="Move down" onClick={() => moveTask(index, 1)}>
                  ↓
                </IconButton>
                <IconButton
                  label="Remove"
                  danger
                  onClick={() => setTasks((current) => current.filter((_, i) => i !== index))}
                >
                  ✕
                </IconButton>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <input
              value={taskDraft}
              onChange={(event) => setTaskDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addTask();
                }
              }}
              placeholder="e.g. Read 20 pages"
              className="flex-1 rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={addTask}
              className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent text-accent-ink"
              aria-label="Add task"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 'summary' && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-text-muted">One last look before you save.</p>

          <SummaryCard title="Challenge" onEdit={() => setStep('setup')}>
            <SummaryRow label="Name" value={title.trim()} />
            <SummaryRow label="Length" value={`${durationDays} days`} />
            <SummaryRow label="Rest days" value={restDaysLabel(restDays)} />
            <SummaryRow label="Reminder" value={formatTime(reminderTime)} />
            <SummaryRow label="Sound" value={soundLabel(reminderSound)} />
            <SummaryRow
              label="If missed"
              value={repeatEnabled ? `Repeat every ${repeatEveryMin} min` : 'No repeat'}
            />
          </SummaryCard>

          <SummaryCard title={`Daily list (${tasks.length})`} onEdit={() => setStep('tasks')}>
            {tasks.map((task, index) => (
              <div key={task.id ?? `new-${index}`} className="flex items-center gap-2 text-sm">
                <CheckIcon className="h-3.5 w-3.5 text-text-muted" />
                {task.title}
              </div>
            ))}
          </SummaryCard>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}

      <div className="flex items-center gap-3">
        {step !== 'setup' && (
          <button
            onClick={() => setStep(step === 'summary' ? 'tasks' : 'setup')}
            className="rounded-xl border border-border px-5 py-3 text-sm font-bold"
          >
            Back
          </button>
        )}
        {step === 'summary' ? (
          <button
            onClick={submit}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-accent-ink disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : submitLabel}
          </button>
        ) : (
          <button
            onClick={() => setStep(step === 'setup' ? 'tasks' : 'summary')}
            disabled={step === 'setup' ? !setupValid : !tasksValid}
            className="flex-1 rounded-xl py-3 text-sm font-bold disabled:cursor-default"
            style={{
              background: (step === 'setup' ? setupValid : tasksValid) ? 'var(--accent)' : 'var(--surface-2)',
              color: (step === 'setup' ? setupValid : tasksValid) ? 'var(--accent-ink)' : 'var(--text-muted)',
            }}
          >
            Continue
          </button>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">{label}</p>
      {children}
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border px-3.5 py-2 text-[13px] font-bold"
      style={{
        background: selected ? 'var(--accent)' : 'var(--bg)',
        borderColor: selected ? 'var(--accent)' : 'var(--border)',
        color: selected ? 'var(--accent-ink)' : 'var(--text)',
      }}
    >
      {label}
    </button>
  );
}

function IconButton({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`px-2 py-0.5 text-sm font-bold ${danger ? 'text-danger' : 'text-text-muted'}`}
    >
      {children}
    </button>
  );
}

function SummaryCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[15px]">{title}</h2>
        <button onClick={onEdit} className="text-[13px] font-bold text-accent">
          Edit
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-text-muted">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
