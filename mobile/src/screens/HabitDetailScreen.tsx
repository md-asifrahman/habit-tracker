import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, fonts } from '../theme/useTheme';
import { useHabitsStore } from '../store/habitsStore';
import { todayIso } from '../store/id';
import { habitColorVars } from '../theme/colors';
import { Heatmap, RingProgress } from '../components/HabitVisuals';
import { BackIcon, CheckIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/RootNavigator';

export default function HabitDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'HabitDetail'>>();
  const { habitId } = route.params;

  const habit = useHabitsStore((s) => s.habits.find((h) => h.id === habitId));
  // logs/challenges are the store's raw arrays (stable references) — deriving
  // stats/heatmap data straight from a selector would return a new object each
  // read and starve useSyncExternalStore into an infinite render loop, so the
  // derived values are memoized here instead.
  const logs = useHabitsStore((s) => s.logs);
  const challenges = useHabitsStore((s) => s.challenges);
  const stats = useMemo(() => useHabitsStore.getState().stats(habitId), [habitId, logs]);
  const activeChallenge = useMemo(
    () => useHabitsStore.getState().activeChallenge(habitId),
    [habitId, challenges],
  );
  const completedDates = useMemo(
    () => useHabitsStore.getState().completedDates(habitId),
    [habitId, logs],
  );
  const isDoneOn = useHabitsStore((s) => s.isDoneOn);
  const toggleCheckIn = useHabitsStore((s) => s.toggleCheckIn);

  if (!habit) return null;

  const today = todayIso();
  const doneToday = isDoneOn(habit.id, today);
  const vars = habitColorVars(colors, habit.color);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <BackIcon color={colors.text} size={15} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]} numberOfLines={1}>
          {habit.title}
        </Text>
        <View style={[styles.dot, { backgroundColor: vars.solid }]} />
      </View>

      {activeChallenge && (
        <View style={[styles.card, styles.challengeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <RingProgress
            value={activeChallenge.dayNumber / activeChallenge.durationDays}
            size={130}
            strokeWidth={11}
            color={vars.solid}
            trackColor={colors.border}
          >
            <Text style={[styles.bigNum, { color: colors.text, fontFamily: fonts.display }]}>{activeChallenge.dayNumber}</Text>
            <Text style={[styles.of, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>
              OF {activeChallenge.durationDays} DAYS
            </Text>
          </RingProgress>
          <Text style={[styles.challengeSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {activeChallenge.durationDays}-day challenge · started{' '}
            {new Date(activeChallenge.startDate).toLocaleDateString()}
          </Text>
        </View>
      )}

      <View style={styles.statRow}>
        <StatChip label="Streak" value={stats.currentStreak} />
        <StatChip label="Best" value={stats.longestStreak} />
        <StatChip label="Rate" value={`${stats.completionRate}%`} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.heatTitle, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>Last 10 weeks</Text>
        <Heatmap dates={completedDates} color={vars.solid} trackColor={colors.border} />
      </View>

      <Pressable
        onPress={() => toggleCheckIn(habit.id, today)}
        style={[styles.cta, { backgroundColor: vars.solid }]}
      >
        <CheckIcon color="#fff" size={16} />
        <Text style={styles.ctaText}>{doneToday ? 'Done today — tap to undo' : 'Mark today done'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statVal, { color: colors.text, fontFamily: fonts.display }]}>{value}</Text>
      <Text style={[styles.statLab, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 19 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20 },
  challengeCard: { alignItems: 'center', gap: 10 },
  bigNum: { fontSize: 34, textAlign: 'center' },
  of: { fontSize: 11, textAlign: 'center' },
  challengeSub: { fontSize: 12.5, textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: 10 },
  statChip: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  statVal: { fontSize: 20 },
  statLab: { fontSize: 10.5, marginTop: 2 },
  heatTitle: { fontSize: 12, marginBottom: 10 },
  cta: { borderRadius: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
});
