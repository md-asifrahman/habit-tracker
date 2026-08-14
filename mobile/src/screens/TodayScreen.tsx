import { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, useTheme } from '../theme/useTheme';
import { useChallengesStore } from '../store/challengesStore';
import { formatTime, todayIso } from '../store/id';
import { ProgressBar, RingProgress } from '../components/ChallengeVisuals';
import { CheckIcon, ChevronIcon, PlusIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { syncInBackground } from '../sync/syncService';
import type { Challenge, DayLog } from '../store/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function TodayScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const challenges = useChallengesStore((state) => state.challenges);
  const activeChallenges = useChallengesStore((state) => state.activeChallenges);
  const syncAllReminders = useChallengesStore((state) => state.syncAllReminders);
  const logFor = useChallengesStore((state) => state.logFor);

  // One card open at a time — the whole point is that the list stays scannable.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const active = useMemo(() => activeChallenges(), [challenges, activeChallenges]);
  const today = todayIso();

  useEffect(() => {
    void syncAllReminders();
  }, [syncAllReminders]);

  const remaining = active.filter((challenge) => !logFor(challenge.id, today)).length;

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  function toggle(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.text, fontFamily: fonts.display }]}>Today</Text>
          <Text style={[styles.date, { color: colors.textMuted, fontFamily: fonts.body }]}>
            {dateLabel}
            {active.length > 0 &&
              ` · ${remaining === 0 ? 'all logged' : `${remaining} left to log`}`}
          </Text>
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
        active.map((challenge) => (
          <TodayCardContainer
            key={challenge.id}
            challenge={challenge}
            expanded={expandedId === challenge.id}
            onToggle={() => toggle(challenge.id)}
            onSaved={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setExpandedId(null);
            }}
          />
        ))
      )}
    </ScrollView>
  );
}

interface CardProps {
  challenge: Challenge;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}

/** Keyed on the saved log so a fresh save (or a day rollover) re-seeds the checkbox state. */
function TodayCardContainer({ challenge, ...rest }: CardProps) {
  const logFor = useChallengesStore((state) => state.logFor);
  const today = todayIso();
  const saved = logFor(challenge.id, today);
  return <TodayCard key={`${saved?.id ?? 'unlogged'}:${today}`} challenge={challenge} saved={saved} {...rest} />;
}

function TodayCard({
  challenge,
  saved,
  expanded,
  onToggle,
  onSaved,
}: CardProps & { saved: DayLog | undefined }) {
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

  function toggleTask(taskId: string) {
    setChecked((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  }

  function save() {
    logDay(challenge.id, today, checked);
    syncInBackground();
    onSaved();
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Collapsed header: enough to know where you stand, nothing more. */}
      <Pressable onPress={onToggle} style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.display }]} numberOfLines={1}>
            {challenge.title}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textMuted, fontFamily: fonts.body }]}>
            Day {dayNumber(challenge)} of {challenge.durationDays} · {formatTime(challenge.reminderTime)}
          </Text>
        </View>

        {saved ? (
          <View style={styles.statusWrap}>
            <RingProgress
              value={saved.completionPercent / 100}
              size={36}
              strokeWidth={4}
              color={colors.success}
              trackColor={colors.border}
            >
              <Text style={[styles.ringMini, { color: colors.text, fontFamily: fonts.display }]}>
                {saved.completionPercent}
              </Text>
            </RingProgress>
          </View>
        ) : (
          <View style={[styles.pendingPill, { backgroundColor: colors.accentTint }]}>
            <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 11.5 }}>Log</Text>
          </View>
        )}

        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <ChevronIcon color={colors.textMuted} size={16} />
        </View>
      </Pressable>

      {expanded && (
        <>
          <View style={{ gap: 2, marginTop: 12 }}>
            {challenge.tasks.map((task) => {
              const on = checked.includes(task.id);
              return (
                <Pressable key={task.id} onPress={() => toggleTask(task.id)} style={styles.taskRow}>
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

          <Pressable
            onPress={() => setChecked(allChecked ? [] : challenge.tasks.map((task) => task.id))}
            style={[styles.selectAllRow, { borderTopColor: colors.border }]}
          >
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

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => navigation.navigate('ChallengeDetail', { challengeId: challenge.id })}
              style={styles.detailsBtn}
            >
              <Text style={{ color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 13 }}>Details</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={!dirty}
              style={[styles.saveBtn, { backgroundColor: dirty ? colors.accent : colors.surface2 }]}
            >
              <Text
                style={{
                  color: dirty ? colors.accentInk : colors.textMuted,
                  fontFamily: fonts.bodyBold,
                  fontSize: 14,
                }}
              >
                {dirty ? `Save — ${pct}%` : `Saved · ${pct}%`}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, marginBottom: 4 },
  greeting: { fontSize: 24 },
  date: { fontSize: 13, marginTop: 2 },
  addButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  empty: { borderRadius: 20, borderWidth: 1, padding: 22, alignItems: 'flex-start' },
  emptyTitle: { fontSize: 17 },
  emptyBody: { fontSize: 13.5, lineHeight: 20, marginTop: 6 },
  emptyBtn: { marginTop: 16, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  card: { borderRadius: 18, borderWidth: 1, padding: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 16 },
  cardSub: { fontSize: 12, marginTop: 2 },
  statusWrap: { alignItems: 'center', justifyContent: 'center' },
  ringMini: { fontSize: 10 },
  pendingPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
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
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  detailsBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  saveBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
