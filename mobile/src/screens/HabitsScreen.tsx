import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, fonts } from '../theme/useTheme';
import { useHabitsStore } from '../store/habitsStore';
import { HabitIconBubble } from '../components/HabitVisuals';
import { PlusIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/RootNavigator';

export default function HabitsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const allHabits = useHabitsStore((s) => s.habits);
  const habits = useMemo(() => allHabits.filter((h) => !h.archived), [allHabits]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>All habits</Text>
            <Pressable onPress={() => navigation.navigate('AddHabit')} style={[styles.addButton, { backgroundColor: colors.accent }]}>
              <PlusIcon color={colors.accentInk} size={16} />
            </Pressable>
          </View>
        }
        ListHeaderComponentStyle={{ marginBottom: 16 }}
        ListEmptyComponent={
          <Text style={{ color: colors.textMuted, fontFamily: fonts.body }}>No habits yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <HabitIconBubble icon={item.icon} color={item.color} colors={colors} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text, fontFamily: fonts.bodyBold }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.rowSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {item.type === 'BUILD' ? 'Build' : 'Break'} · {item.frequency.toLowerCase()}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24 },
  addButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 12 },
  rowTitle: { fontSize: 14 },
  rowSub: { fontSize: 12, marginTop: 2 },
});
