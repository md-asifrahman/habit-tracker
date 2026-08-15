import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
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

/**
 * Day-by-day strip: opacity carries how much of that day's list got done. Tapping a past day
 * opens it for logging, which is how a missed day gets filled in after the fact.
 */
export function DayStrip({ days, onPressDay }: { days: DayCell[]; onPressDay?: (day: DayCell) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.strip}>
      {days.map((day) => {
        const cell = (
          <View
            style={[
              styles.cell,
              day.restDay
                ? // Rest days read as "not applicable", not as a zero.
                  { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1, opacity: 0.5 }
                : {
                    backgroundColor: day.future
                      ? 'transparent'
                      : day.completionPercent === 0
                        ? colors.surface2
                        : colors.accent,
                    opacity:
                      day.future || day.completionPercent === 0 ? 1 : 0.25 + (day.completionPercent / 100) * 0.75,
                    borderColor: colors.border,
                    borderWidth: day.future ? 1 : 0,
                  },
            ]}
          />
        );
        const tappable = !!onPressDay && !day.future && !day.restDay;
        return tappable ? (
          <Pressable key={day.date} onPress={() => onPressDay(day)}>
            {cell}
          </Pressable>
        ) : (
          <View key={day.date}>{cell}</View>
        );
      })}
    </View>
  );
}

/**
 * Completion over time. Bars rather than a line: the data is one value per day with gaps for
 * rest days, and a line would imply a continuity that isn't there.
 */
export function TrendChart({ days, height = 96 }: { days: DayCell[]; height?: number }) {
  const { colors } = useTheme();
  const scored = days.filter((day) => !day.future && !day.restDay);

  if (scored.length === 0) {
    return (
      <Text style={{ color: colors.textMuted, fontFamily: fonts.body, fontSize: 12.5 }}>
        Nothing to chart yet — log a day first.
      </Text>
    );
  }

  const width = 300;
  const plotHeight = height - 18;
  const gap = scored.length > 40 ? 0.5 : 2;
  const barWidth = Math.max(1.5, (width - gap * (scored.length - 1)) / scored.length);
  const average = Math.round(scored.reduce((sum, day) => sum + day.completionPercent, 0) / scored.length);

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {[0, 50, 100].map((value) => (
          <Line
            key={value}
            x1={0}
            x2={width}
            y1={plotHeight - (value / 100) * plotHeight}
            y2={plotHeight - (value / 100) * plotHeight}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {scored.map((day, index) => {
          const barHeight = Math.max(1, (day.completionPercent / 100) * plotHeight);
          return (
            <Rect
              key={day.date}
              x={index * (barWidth + gap)}
              y={plotHeight - barHeight}
              width={barWidth}
              height={barHeight}
              rx={barWidth > 3 ? 1.5 : 0}
              fill={day.completionPercent === 100 ? colors.success : colors.accent}
              opacity={day.completionPercent === 0 ? 0.25 : 1}
            />
          );
        })}
        <Line
          x1={0}
          x2={width}
          y1={plotHeight - (average / 100) * plotHeight}
          y2={plotHeight - (average / 100) * plotHeight}
          stroke={colors.coral}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      </Svg>
      <View style={styles.trendLegend}>
        <Text style={{ color: colors.textMuted, fontFamily: fonts.body, fontSize: 11 }}>
          Day 1
        </Text>
        <Text style={{ color: colors.coral, fontFamily: fonts.bodyBold, fontSize: 11 }}>
          average {average}%
        </Text>
        <Text style={{ color: colors.textMuted, fontFamily: fonts.body, fontSize: 11 }}>
          Day {scored[scored.length - 1].dayNumber}
        </Text>
      </View>
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
  trendLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cell: { width: 14, height: 14, borderRadius: 4 },
  tile: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center' },
  tileValue: { fontSize: 20 },
  tileLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
});
