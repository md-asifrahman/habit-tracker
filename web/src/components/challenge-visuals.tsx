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

/**
 * Day-by-day strip: opacity carries how much of that day's list got done. Clicking a past day
 * opens it for logging, which is how a missed day gets filled in after the fact.
 */
export function DayStrip({
  days,
  onSelectDay,
}: {
  days: ChallengeReport['days'];
  onSelectDay?: (day: ChallengeReport['days'][number]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {days.map((day) => {
        const label = day.restDay
          ? 'rest day'
          : day.future
            ? 'upcoming'
            : `${day.completionPercent}%`;
        const style = day.restDay
          ? { border: '1px solid var(--border)', opacity: 0.5 }
          : day.future
            ? { border: '1px solid var(--border)' }
            : day.completionPercent === 0
              ? { background: 'var(--surface-2)' }
              : { background: 'var(--accent)', opacity: 0.25 + (day.completionPercent / 100) * 0.75 };
        const clickable = !!onSelectDay && !day.future && !day.restDay;
        return (
          <button
            key={day.date}
            type="button"
            disabled={!clickable}
            onClick={() => onSelectDay?.(day)}
            title={`Day ${day.dayNumber} · ${day.date} · ${label}`}
            className={`h-3.5 w-3.5 rounded-[4px] ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-accent' : 'cursor-default'}`}
            style={style}
          />
        );
      })}
    </div>
  );
}

/**
 * Completion over time. Bars rather than a line: it's one value per day with gaps for rest
 * days, and a line would imply a continuity that isn't there.
 */
export function TrendChart({ days, height = 96 }: { days: ChallengeReport['days']; height?: number }) {
  const scored = days.filter((day) => !day.future && !day.restDay);
  if (scored.length === 0) {
    return <p className="text-[12.5px] text-text-muted">Nothing to chart yet — log a day first.</p>;
  }

  const width = 300;
  const plotHeight = height - 18;
  const gap = scored.length > 40 ? 0.5 : 2;
  const barWidth = Math.max(1.5, (width - gap * (scored.length - 1)) / scored.length);
  const average = Math.round(scored.reduce((sum, day) => sum + day.completionPercent, 0) / scored.length);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-24 w-full">
        {[0, 50, 100].map((value) => (
          <line
            key={value}
            x1={0}
            x2={width}
            y1={plotHeight - (value / 100) * plotHeight}
            y2={plotHeight - (value / 100) * plotHeight}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        {scored.map((day, index) => {
          const barHeight = Math.max(1, (day.completionPercent / 100) * plotHeight);
          return (
            <rect
              key={day.date}
              x={index * (barWidth + gap)}
              y={plotHeight - barHeight}
              width={barWidth}
              height={barHeight}
              rx={barWidth > 3 ? 1.5 : 0}
              fill={day.completionPercent === 100 ? 'var(--success)' : 'var(--accent)'}
              opacity={day.completionPercent === 0 ? 0.25 : 1}
            >
              <title>{`Day ${day.dayNumber} · ${day.completionPercent}%`}</title>
            </rect>
          );
        })}
        <line
          x1={0}
          x2={width}
          y1={plotHeight - (average / 100) * plotHeight}
          y2={plotHeight - (average / 100) * plotHeight}
          stroke="var(--coral)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[11px]">
        <span className="text-text-muted">Day 1</span>
        <span className="font-bold text-coral">average {average}%</span>
        <span className="text-text-muted">Day {scored[scored.length - 1].dayNumber}</span>
      </div>
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
