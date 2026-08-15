import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, useTheme } from '../theme/useTheme';
import { useChallengesStore } from '../store/challengesStore';
import { isoWeekday, todayIso } from '../store/id';
import { DayChecklist } from '../components/DayChecklist';
import { BackIcon } from '../components/icons';
import { syncInBackground } from '../sync/syncService';
import type { RootStackParamList } from '../navigation/RootNavigator';

/**
 * Filling in a day you missed. Forgetting to log at bedtime shouldn't cost you the day —
 * without this, one missed night is permanently 0% with no way to correct it.
 */
export default function LogDayScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { challengeId, date } = useRoute<RouteProp<RootStackParamList, 'LogDay'>>().params;

  const challenge = useChallengesStore((state) => state.challenges.find((c) => c.id === challengeId));
  const logFor = useChallengesStore((state) => state.logFor);
  const logDay = useChallengesStore((state) => state.logDay);

  const saved = challenge ? logFor(challengeId, date) : undefined;

  if (!challenge) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textMuted, fontFamily: fonts.body }}>Challenge not found.</Text>
      </View>
    );
  }

  const isRestDay = (challenge.restDays ?? []).includes(isoWeekday(date));
  const isFuture = date > todayIso();
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon color={colors.text} size={16} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.topTitle, { color: colors.text, fontFamily: fonts.display }]} numberOfLines={1}>
            {dateLabel}
          </Text>
          <Text style={{ color: colors.textMuted, fontFamily: fonts.body, fontSize: 12 }}>{challenge.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {isFuture ? (
            <Text style={{ color: colors.textMuted, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20 }}>
              That day hasn&apos;t happened yet.
            </Text>
          ) : isRestDay ? (
            <Text style={{ color: colors.textMuted, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20 }}>
              This was a rest day — nothing was expected, and it doesn&apos;t count either way.
            </Text>
          ) : (
            <DayChecklist
              challenge={challenge}
              saved={saved}
              saveLabel={saved ? 'Update' : 'Log this day'}
              onSave={(completedTaskIds, note) => {
                logDay(challengeId, date, completedTaskIds, note || undefined);
                syncInBackground();
                navigation.goBack();
              }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17 },
  content: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
});
