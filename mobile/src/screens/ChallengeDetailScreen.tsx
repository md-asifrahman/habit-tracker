import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, useTheme } from '../theme/useTheme';
import { useChallengesStore } from '../store/challengesStore';
import { formatTime, restDaysLabel, todayIso } from '../store/id';
import { soundLabel } from '../notifications/reminders';
import { DayStrip, ProgressBar, RingProgress, StatTile, TrendChart } from '../components/ChallengeVisuals';
import { BackIcon } from '../components/icons';
import { syncInBackground } from '../sync/syncService';
import { maybeAskForReview } from '../store/reviewPrompt';
import type { RootStackParamList } from '../navigation/RootNavigator';

export default function ChallengeDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { challengeId } = useRoute<RouteProp<RootStackParamList, 'ChallengeDetail'>>().params;

  const challenge = useChallengesStore((state) => state.challenges.find((c) => c.id === challengeId));
  const report = useChallengesStore((state) => state.report);
  const abandonChallenge = useChallengesStore((state) => state.abandonChallenge);
  const deleteChallenge = useChallengesStore((state) => state.deleteChallenge);
  const duplicateChallenge = useChallengesStore((state) => state.duplicateChallenge);

  const summary = challenge ? report(challengeId) : null;

  // Finishing a challenge you kept up with is the one moment worth asking for a rating.
  // The local store never flips status to COMPLETED, so a run past its end date counts too.
  const finished = !!challenge && !(challenge.status === 'ACTIVE' && challenge.endDate >= todayIso());
  const daysLogged = summary?.daysLogged ?? 0;
  const averagePercent = summary?.averagePercent ?? 0;
  useEffect(() => {
    if (finished) void maybeAskForReview(daysLogged, averagePercent);
  }, [finished, daysLogged, averagePercent]);

  if (!challenge || !summary) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textMuted, fontFamily: fonts.body }}>Challenge not found.</Text>
      </View>
    );
  }

  const isRunning = challenge.status === 'ACTIVE' && challenge.endDate >= todayIso();

  function confirmDelete() {
    Alert.alert('Delete challenge?', 'This removes the challenge and all its day logs.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteChallenge(challengeId);
        syncInBackground();
        navigation.goBack();
      } },
    ]);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon color={colors.text} size={16} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.text, fontFamily: fonts.display }]} numberOfLines={1}>
          {challenge.title}
        </Text>
        <Pressable onPress={() => navigation.navigate('AddChallenge', { challengeId })}>
          <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 13 }}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <RingProgress
            value={summary.averagePercent / 100}
            size={78}
            strokeWidth={9}
            color={colors.accent}
            trackColor={colors.border}
          >
            <Text style={[styles.heroPct, { color: colors.text, fontFamily: fonts.display }]}>
              {summary.averagePercent}%
            </Text>
          </RingProgress>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: colors.text, fontFamily: fonts.bodyBold }]}>
              Average completion
            </Text>
            <Text style={[styles.heroSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
              across {summary.daysElapsed} day{summary.daysElapsed === 1 ? '' : 's'} so far
              {'\n'}
              {challenge.startDate} → {challenge.endDate}
            </Text>
          </View>
        </View>

        <View style={styles.tileRow}>
          <StatTile label="Perfect days" value={String(summary.perfectDays)} />
          <StatTile label="Best streak" value={String(summary.bestStreak)} />
          <StatTile label="Not logged" value={String(summary.daysMissed)} />
        </View>

        <Section title="Day by day">
          <DayStrip
            days={summary.days}
            onPressDay={(day) => navigation.navigate('LogDay', { challengeId, date: day.date })}
          />
          <Text style={[styles.caption, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Darker means more of the list got done. Tap any past day to fill it in or correct it.
            Outlined squares are rest days or still ahead.
          </Text>
        </Section>

        <Section title="Trend">
          <TrendChart days={summary.days} />
        </Section>

        <Section title="Task breakdown">
          <View style={{ gap: 14 }}>
            {summary.taskBreakdown.map((task) => (
              <View key={task.taskId}>
                <View style={styles.breakdownHead}>
                  <Text
                    style={{ color: colors.text, fontFamily: fonts.body, fontSize: 13.5, flex: 1 }}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 12.5 }}>
                    {task.completedDays}/{task.elapsedDays}
                  </Text>
                </View>
                <View style={{ marginTop: 6 }}>
                  <ProgressBar value={task.percent} color={colors.teal} trackColor={colors.surface2} />
                </View>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Reminder">
          <Text style={{ color: colors.text, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21 }}>
            {formatTime(challenge.reminderTime)} · {soundLabel(challenge.reminderSound)}
            {'\n'}
            {challenge.repeatEnabled
              ? `Repeats every ${challenge.repeatEveryMin} min until the day is logged`
              : 'No repeat if missed'}
            {'\n'}
            Rest days: {restDaysLabel(challenge.restDays ?? [])}
          </Text>
        </Section>

        <View style={{ gap: 10, marginTop: 8 }}>
          {!isRunning && (
            <Pressable
              onPress={() => {
                const copy = duplicateChallenge(challengeId);
                syncInBackground();
                if (copy) navigation.replace('ChallengeDetail', { challengeId: copy.id });
              }}
              style={[styles.secondaryBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
            >
              <Text style={{ color: colors.accentInk, fontFamily: fonts.bodyBold, fontSize: 13.5 }}>
                Run it again
              </Text>
            </Pressable>
          )}
          {isRunning && (
            <Pressable
              onPress={() => {
                abandonChallenge(challengeId);
                syncInBackground();
              }}
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13.5 }}>End challenge</Text>
            </Pressable>
          )}
          <Pressable onPress={confirmDelete} style={[styles.secondaryBtn, { borderColor: colors.border }]}>
            <Text style={{ color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 13.5 }}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
      <View style={{ marginTop: 12 }}>{children}</View>
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
  topTitle: { fontSize: 17, flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 20, borderWidth: 1, padding: 18 },
  heroPct: { fontSize: 17 },
  heroLabel: { fontSize: 14 },
  heroSub: { fontSize: 12.5, marginTop: 4, lineHeight: 18 },
  tileRow: { flexDirection: 'row', gap: 10 },
  section: { borderRadius: 20, borderWidth: 1, padding: 18 },
  sectionTitle: { fontSize: 15 },
  caption: { fontSize: 12, marginTop: 12, lineHeight: 17 },
  breakdownHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secondaryBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 13, alignItems: 'center' },
});
