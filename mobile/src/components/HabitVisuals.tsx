import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { HabitColorKey, HabitIconKey } from '../store/types';
import { habitColorVars, ThemeColors } from '../theme/colors';
import { BanIcon, BookIcon, DropletIcon, LeafIcon, WalkIcon } from './icons';

const ICONS: Record<HabitIconKey, (props: { color?: string; size?: number }) => React.ReactElement> = {
  walk: WalkIcon,
  droplet: DropletIcon,
  book: BookIcon,
  ban: BanIcon,
  leaf: LeafIcon,
};

export const HABIT_ICON_OPTIONS: HabitIconKey[] = ['leaf', 'walk', 'droplet', 'book', 'ban'];
export const HABIT_COLOR_OPTIONS: HabitColorKey[] = ['accent', 'teal', 'coral', 'amber'];

export function HabitIconBubble({
  icon,
  color,
  colors,
  size = 40,
}: {
  icon: HabitIconKey;
  color: HabitColorKey;
  colors: ThemeColors;
  size?: number;
}) {
  const Icon = ICONS[icon];
  const vars = habitColorVars(colors, color);
  return (
    <View style={[styles.bubble, { width: size, height: size, backgroundColor: vars.tint }]}>
      <Icon color={vars.solid} size={size * 0.5} />
    </View>
  );
}

export function RingProgress({
  value,
  size = 64,
  strokeWidth = 7,
  color,
  trackColor,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 1));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.ringCenter}>{children}</View>
      </View>
    </View>
  );
}

export function Heatmap({ dates, color, trackColor }: { dates: Set<string>; color: string; trackColor: string }) {
  const days: { key: string; on: boolean }[] = [];
  const today = new Date();
  for (let i = 69; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, on: dates.has(key) });
  }

  return (
    <View style={styles.heatGrid}>
      {days.map((day) => (
        <View key={day.key} style={[styles.heatCell, { backgroundColor: day.on ? color : trackColor }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatCell: { width: '8.2%', aspectRatio: 1, borderRadius: 3 },
});
