import { useEffect, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, fonts } from '../theme/useTheme';
import { useHabitsStore } from '../store/habitsStore';
import { todayIso } from '../store/id';
import { HabitIconBubble, RingProgress } from '../components/HabitVisuals';
import { CheckIcon, PlusIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Habit } from '../store/types';

export default function TodayScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const allHabits = useHabitsStore((s) => s.habits);
  const habits = useMemo(() => allHabits.filter((h) => !h.archived), [allHabits]);
  const seedIfEmpty = useHabitsStore((s) => s.seedIfEmpty);
  const isDoneOn = useHabitsStore((s) => s.isDoneOn);
  const toggleCheckIn = useHabitsStore((s) => s.toggleCheckIn);
  const today = todayIso();

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  const doneCount = habits.filter((h) => isDoneOn(h.id, today)).length;
  const total = habits.length;

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.text, fontFamily: fonts.display }]}>Good day, Asif</Text>
              <Text style={[styles.date, { color: colors.textMuted, fontFamily: fonts.body }]}>{dateLabel}</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('AddHabit')}
              style={[styles.addButton, { backgroundColor: colors.accent }]}
            >
              <PlusIcon color={colors.accentInk} size={16} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.body }}>
              No habits yet. Tap + to add your first one.
            </Text>
          </View>
        }
        ListHeaderComponentStyle={{ marginBottom: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            done={isDoneOn(item.id, today)}
            onToggle={() => toggleCheckIn(item.id, today)}
            onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
          />
        )}
      />
      {total > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <RingProgress value={total ? doneCount / total : 0} size={48} strokeWidth={6} color={colors.accent} trackColor={colors.border}>
            <Text style={[styles.ringLabel, { color: colors.text, fontFamily: fonts.display }]}>
              {doneCount}/{total}
            </Text>
          </RingProgress>
          <Text style={[styles.summaryText, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {total - doneCount === 0 ? 'All done for today' : `${total - doneCount} habit${total - doneCount === 1 ? '' : 's'} left`}
          </Text>
        </View>
      )}
    </View>
  );
}

function HabitRow({
  habit,
  done,
  onToggle,
  onPress,
}: {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable onPress={onPress} style={styles.rowMain}>
        <HabitIconBubble icon={habit.icon} color={habit.color} colors={colors} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.rowTitle, { color: colors.text, fontFamily: fonts.bodyBold }]} numberOfLines={1}>
            {habit.title}
          </Text>
          <Text style={[styles.rowSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {habit.type === 'BUILD' ? 'Build' : 'Break'} · {habit.frequency.toLowerCase()}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onToggle}
        style={[
          styles.check,
          { borderColor: done ? colors.success : colors.border, backgroundColor: done ? colors.success : 'transparent' },
        ]}
      >
        {done && <CheckIcon color="#fff" size={14} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  greeting: { fontSize: 21 },
  date: { fontSize: 13, marginTop: 2 },
  addButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 12 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 14 },
  rowSub: { fontSize: 12, marginTop: 2 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.8, alignItems: 'center', justifyContent: 'center' },
  summaryCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  ringLabel: { fontSize: 12 },
  summaryText: { fontSize: 13, flex: 1 },
});
