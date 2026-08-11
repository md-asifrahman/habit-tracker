import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, useTheme } from '../theme/useTheme';
import { useChallengesStore } from '../store/challengesStore';
import { formatTime, todayIso } from '../store/id';
import { ProgressBar } from '../components/ChallengeVisuals';
import { PlusIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { Challenge } from '../store/types';

export default function ChallengesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const challenges = useChallengesStore((state) => state.challenges);

  const today = todayIso();
  const { running, finished } = useMemo(() => {
    const isRunning = (challenge: Challenge) => challenge.status === 'ACTIVE' && challenge.endDate >= today;
    return {
      running: challenges.filter(isRunning),
      finished: challenges.filter((challenge) => !isRunning(challenge)),
    };
  }, [challenges, today]);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Challenges</Text>
        <Pressable
          onPress={() => navigation.navigate('AddChallenge', {})}
          style={[styles.addButton, { backgroundColor: colors.accent }]}
        >
          <PlusIcon color={colors.accentInk} size={16} />
        </Pressable>
      </View>

      {challenges.length === 0 && (
        <Text style={{ color: colors.textMuted, fontFamily: fonts.body, fontSize: 13.5 }}>
          Nothing yet. Tap + to set up your first challenge.
        </Text>
      )}

      {running.length > 0 && <SectionLabel text="RUNNING" />}
      {running.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}

      {finished.length > 0 && <SectionLabel text="FINISHED" />}
      {finished.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} />
      ))}
    </ScrollView>
  );
}

function SectionLabel({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>{text}</Text>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const report = useChallengesStore((state) => state.report);
  const dayNumber = useChallengesStore((state) => state.dayNumber);

  const summary = report(challenge.id);
  const isRunning = challenge.status === 'ACTIVE' && challenge.endDate >= todayIso();
  const elapsedPct = Math.round(((summary?.daysElapsed ?? 0) / challenge.durationDays) * 100);

  return (
    <Pressable
      onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.cardHead}>
        <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.display }]} numberOfLines={1}>
          {challenge.title}
        </Text>
        <Text style={[styles.badge, { color: colors.accent, fontFamily: fonts.bodyBold }]}>
          {summary?.averagePercent ?? 0}%
        </Text>
      </View>
      <Text style={[styles.cardSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
        {isRunning
          ? `Day ${dayNumber(challenge)} of ${challenge.durationDays} · reminder ${formatTime(challenge.reminderTime)}`
          : `${challenge.status === 'ABANDONED' ? 'Abandoned' : 'Completed'} · ${challenge.durationDays} days`}
      </Text>
      <View style={{ marginTop: 10 }}>
        <ProgressBar value={elapsedPct} color={colors.accent} trackColor={colors.surface2} />
      </View>
      <Text style={[styles.cardFoot, { color: colors.textMuted, fontFamily: fonts.body }]}>
        {summary?.perfectDays ?? 0} perfect · {summary?.daysMissed ?? 0} not logged
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, marginBottom: 4 },
  title: { fontSize: 24, flex: 1 },
  addButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, letterSpacing: 0.6, marginTop: 10 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 16, flex: 1 },
  badge: { fontSize: 14 },
  cardSub: { fontSize: 12.5, marginTop: 3 },
  cardFoot: { fontSize: 12, marginTop: 8 },
});
