import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { fonts, useTheme } from '../theme/useTheme';
import type { DayCell } from '../store/types';

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

export function ProgressBar({ value, color, trackColor }: { value: number; color: string; trackColor: string }) {
  return (
    <View style={[styles.barTrack, { backgroundColor: trackColor }]}>
      <View style={[styles.barFill, { backgroundColor: color, width: `${Math.min(100, Math.max(0, value))}%` }]} />
    </View>
  );
}

/** Day-by-day strip: opacity carries how much of that day's list got done. */
export function DayStrip({ days }: { days: DayCell[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.strip}>
      {days.map((day) => (
        <View
          key={day.date}
          style={[
            styles.cell,
            {
              backgroundColor: day.future
                ? 'transparent'
                : day.completionPercent === 0
                  ? colors.surface2
                  : colors.accent,
              opacity: day.future ? 1 : day.completionPercent === 0 ? 1 : 0.25 + (day.completionPercent / 100) * 0.75,
              borderColor: colors.border,
              borderWidth: day.future ? 1 : 0,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function StatTile({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.tileValue, { color: colors.text, fontFamily: fonts.display }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: colors.textMuted, fontFamily: fonts.body }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ringCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: 14, height: 14, borderRadius: 4 },
  tile: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center' },
  tileValue: { fontSize: 20 },
  tileLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
});
