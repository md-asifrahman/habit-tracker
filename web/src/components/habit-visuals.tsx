import { HabitColor, HabitIcon } from '@/lib/habits';
import { WalkIcon, DropletIcon, BookIcon, BanIcon, LeafIcon } from './icons';

const ICONS: Record<HabitIcon, (props: { className?: string }) => React.ReactElement> = {
  walk: WalkIcon,
  droplet: DropletIcon,
  book: BookIcon,
  ban: BanIcon,
  leaf: LeafIcon,
};

const COLOR_VARS: Record<HabitColor, { tint: string; solid: string }> = {
  accent: { tint: 'var(--accent-tint)', solid: 'var(--accent)' },
  teal: { tint: 'var(--teal-tint)', solid: 'var(--teal)' },
  coral: { tint: 'var(--coral-tint)', solid: 'var(--coral)' },
  amber: { tint: 'var(--amber-tint)', solid: 'var(--amber)' },
};

export function habitColorVars(color: HabitColor) {
  return COLOR_VARS[color];
}

export const HABIT_ICON_OPTIONS: HabitIcon[] = ['leaf', 'walk', 'droplet', 'book', 'ban'];
export const HABIT_COLOR_OPTIONS: HabitColor[] = ['accent', 'teal', 'coral', 'amber'];

export function HabitIconBubble({ icon, color, size = 40 }: { icon: HabitIcon; color: HabitColor; size?: number }) {
  const Icon = ICONS[icon];
  const vars = COLOR_VARS[color];
  return (
    <div
      className="flex flex-none items-center justify-center rounded-xl"
      style={{ width: size, height: size, background: vars.tint, color: vars.solid }}
    >
      <Icon className="h-1/2 w-1/2" />
    </div>
  );
}

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

export function Heatmap({ dates, color = 'var(--accent)' }: { dates: Set<string>; color?: string }) {
  const days: { key: string; on: boolean }[] = [];
  const today = new Date();
  for (let i = 69; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, on: dates.has(key) });
  }

  return (
    <div className="grid grid-cols-10 gap-1">
      {days.map((day) => (
        <span
          key={day.key}
          title={day.key}
          className="aspect-square rounded-[3px]"
          style={{ background: day.on ? color : 'var(--border)' }}
        />
      ))}
    </div>
  );
}
