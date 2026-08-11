import type { ChallengeReport } from '@/lib/challenges';

export function RingProgress({
  value,
  size = 64,
  strokeWidth = 7,
  color = 'var(--accent)',
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 1));

  return (
    <div className="relative flex-none" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, color = 'var(--accent)' }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

/** Day-by-day strip: opacity carries how much of that day's list got done. */
export function DayStrip({ days }: { days: ChallengeReport['days'] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {days.map((day) => (
        <span
          key={day.date}
          title={`Day ${day.dayNumber} · ${day.date} · ${day.future ? 'upcoming' : `${day.completionPercent}%`}`}
          className="h-3.5 w-3.5 rounded-[4px]"
          style={
            day.future
              ? { border: '1px solid var(--border)' }
              : day.completionPercent === 0
                ? { background: 'var(--surface-2)' }
                : { background: 'var(--accent)', opacity: 0.25 + (day.completionPercent / 100) * 0.75 }
          }
        />
      ))}
    </div>
  );
}

export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface p-4 text-center">
      <p className="font-display text-xl tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-text-muted">{label}</p>
    </div>
  );
}
