import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTheme, fonts } from '../theme/useTheme';
import { useHabitsStore } from '../store/habitsStore';
import { habitColorVars } from '../theme/colors';
import { HabitIconBubble } from '../components/HabitVisuals';

export default function StatsScreen() {
  const { colors } = useTheme();
  const allHabits = useHabitsStore((s) => s.habits);
  const habits = useMemo(() => allHabits.filter((h) => !h.archived), [allHabits]);
  const stats = useHabitsStore((s) => s.stats);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={<Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Stats</Text>}
        ListHeaderComponentStyle={{ marginBottom: 16 }}
        ListEmptyComponent={<Text style={{ color: colors.textMuted, fontFamily: fonts.body }}>Add a habit to see stats.</Text>}
        renderItem={({ item }) => {
          const s = stats(item.id);
          const vars = habitColorVars(colors, item.color);
          return (
            <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <HabitIconBubble icon={item.icon} color={item.color} colors={colors} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.rowTitle, { color: colors.text, fontFamily: fonts.bodyBold }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.rowSub, { color: colors.textMuted, fontFamily: fonts.body }]}>{s.completionRate}% completion</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.streak, { color: vars.solid, fontFamily: fonts.display }]}>{s.currentStreak}</Text>
                <Text style={[styles.streakLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>Streak</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24 },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 12 },
  rowTitle: { fontSize: 14 },
  rowSub: { fontSize: 12, marginTop: 2 },
  streak: { fontSize: 18 },
  streakLabel: { fontSize: 10, marginTop: 1 },
});
