import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, useTheme } from '../theme/useTheme';
import { useChallengesStore } from '../store/challengesStore';
import { formatTime, todayIso } from '../store/id';
import { ProgressBar, RingProgress } from '../components/ChallengeVisuals';
import { CheckIcon, PlusIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { syncInBackground } from '../sync/syncService';
import type { Challenge, DayLog } from '../store/types';

export default function TodayScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const challenges = useChallengesStore((state) => state.challenges);
  const activeChallenges = useChallengesStore((state) => state.activeChallenges);
  const syncAllReminders = useChallengesStore((state) => state.syncAllReminders);

  const active = useMemo(() => activeChallenges(), [challenges, activeChallenges]);

  useEffect(() => {
    void syncAllReminders();
  }, [syncAllReminders]);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.text, fontFamily: fonts.display }]}>Today</Text>
          <Text style={[styles.date, { color: colors.textMuted, fontFamily: fonts.body }]}>{dateLabel}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('AddChallenge', {})}
          style={[styles.addButton, { backgroundColor: colors.accent }]}
        >
          <PlusIcon color={colors.accentInk} size={16} />
        </Pressable>
      </View>

      {active.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: fonts.display }]}>
            No challenge running
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Start one by listing the things you want to do every day, then tick them off each night.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('AddChallenge', {})}
            style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: colors.accentInk, fontFamily: fonts.bodyBold, fontSize: 14 }}>New challenge</Text>
          </Pressable>
        </View>
      ) : (
        active.map((challenge) => <TodayCardContainer key={challenge.id} challenge={challenge} />)
      )}
    </ScrollView>
  );
}

/** Keyed on the saved log so a fresh save (or a day rollover) re-seeds the checkbox state. */
function TodayCardContainer({ challenge }: { challenge: Challenge }) {
  const logFor = useChallengesStore((state) => state.logFor);
  const today = todayIso();
  const saved = logFor(challenge.id, today);
  return <TodayCard key={`${saved?.id ?? 'unlogged'}:${today}`} challenge={challenge} saved={saved} />;
}

function TodayCard({ challenge, saved }: { challenge: Challenge; saved: DayLog | undefined }) {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const logDay = useChallengesStore((state) => state.logDay);
  const dayNumber = useChallengesStore((state) => state.dayNumber);

  const today = todayIso();
  const [checked, setChecked] = useState<string[]>(saved?.completedTaskIds ?? []);

  const total = challenge.tasks.length;
  const done = checked.length;
  const pct = total === 0 ? 0 : Math.round((done * 100) / total);
  const allChecked = total > 0 && done === total;
  const dirty = !saved || !sameSet(checked, saved.completedTaskIds);

  function toggle(taskId: string) {
    setChecked((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  }

  function toggleAll() {
    setChecked(allChecked ? [] : challenge.tasks.map((task) => task.id));
  }

  function save() {
    logDay(challenge.id, today, checked);
    syncInBackground();
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        style={styles.cardHead}
        onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.display }]} numberOfLines={1}>
            {challenge.title}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Day {dayNumber(challenge)} of {challenge.durationDays} · reminder {formatTime(challenge.reminderTime)}
          </Text>
        </View>
        <RingProgress value={pct / 100} size={52} strokeWidth={6} color={colors.accent} trackColor={colors.border}>
          <Text style={[styles.ringLabel, { color: colors.text, fontFamily: fonts.display }]}>{pct}%</Text>
        </RingProgress>
      </Pressable>

      <View style={{ gap: 2, marginTop: 12 }}>
        {challenge.tasks.map((task) => {
          const on = checked.includes(task.id);
          return (
            <Pressable key={task.id} onPress={() => toggle(task.id)} style={styles.taskRow}>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: on ? colors.success : colors.border,
                    backgroundColor: on ? colors.success : 'transparent',
                  },
                ]}
              >
                {on && <CheckIcon color="#fff" size={13} />}
              </View>
              <Text
                style={[
                  styles.taskText,
                  {
                    color: on ? colors.textMuted : colors.text,
                    fontFamily: fonts.body,
                    textDecorationLine: on ? 'line-through' : 'none',
                  },
                ]}
              >
                {task.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={toggleAll} style={[styles.selectAllRow, { borderTopColor: colors.border }]}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: allChecked ? colors.accent : colors.border,
              backgroundColor: allChecked ? colors.accent : 'transparent',
            },
          ]}
        >
          {allChecked && <CheckIcon color={colors.accentInk} size={13} />}
        </View>
        <Text style={[styles.selectAllText, { color: colors.text, fontFamily: fonts.bodyBold }]}>Select all</Text>
        <Text style={[styles.countText, { color: colors.textMuted, fontFamily: fonts.body }]}>
          {done}/{total}
        </Text>
      </Pressable>

      <View style={{ marginTop: 12 }}>
        <ProgressBar value={pct} color={colors.accent} trackColor={colors.surface2} />
      </View>

      <Pressable
        onPress={save}
        disabled={!dirty}
        style={[
          styles.saveBtn,
          {
            backgroundColor: dirty ? colors.accent : colors.surface2,
          },
        ]}
      >
        <Text
          style={{
            color: dirty ? colors.accentInk : colors.textMuted,
            fontFamily: fonts.bodyBold,
            fontSize: 14,
          }}
        >
          {dirty ? `Save today — ${pct}%` : `Saved · ${pct}%`}
        </Text>
      </Pressable>
    </View>
  );
}

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  greeting: { fontSize: 24 },
  date: { fontSize: 13, marginTop: 2 },
  addButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  empty: { borderRadius: 20, borderWidth: 1, padding: 22, alignItems: 'flex-start' },
  emptyTitle: { fontSize: 17 },
  emptyBody: { fontSize: 13.5, lineHeight: 20, marginTop: 6 },
  emptyBtn: { marginTop: 16, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 17 },
  cardSub: { fontSize: 12.5, marginTop: 3 },
  ringLabel: { fontSize: 12 },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.8, alignItems: 'center', justifyContent: 'center' },
  taskText: { fontSize: 14, flex: 1 },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    marginTop: 6,
    paddingTop: 12,
  },
  selectAllText: { fontSize: 13.5, flex: 1 },
  countText: { fontSize: 13 },
  saveBtn: { marginTop: 14, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
