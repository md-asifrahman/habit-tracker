import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fonts, useTheme } from '../theme/useTheme';
import { useChallengesStore, type ChallengeDraft } from '../store/challengesStore';
import { formatTime, restDaysLabel, WEEKDAY_LABELS } from '../store/id';
import { normalizeSound, SOUND_OPTIONS, soundLabel } from '../notifications/reminders';
import { BackIcon, CheckIcon, PlusIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { syncInBackground } from '../sync/syncService';
import type { SoundKey } from '../store/types';

const DURATION_PRESETS = [7, 21, 30, 100];
const REPEAT_PRESETS = [15, 30, 60];

type Step = 'setup' | 'tasks' | 'summary';

export default function AddChallengeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddChallenge'>>();
  const editingId = route.params?.challengeId;

  const challenges = useChallengesStore((state) => state.challenges);
  const addChallenge = useChallengesStore((state) => state.addChallenge);
  const updateChallenge = useChallengesStore((state) => state.updateChallenge);
  const existing = useMemo(
    () => challenges.find((challenge) => challenge.id === editingId),
    [challenges, editingId],
  );

  const [step, setStep] = useState<Step>('setup');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [durationDays, setDurationDays] = useState(existing?.durationDays ?? 21);
  const [customDuration, setCustomDuration] = useState(
    existing && !DURATION_PRESETS.includes(existing.durationDays) ? String(existing.durationDays) : '',
  );
  const [reminderTime, setReminderTime] = useState(existing?.reminderTime ?? '22:00');
  const [reminderSound, setReminderSound] = useState<SoundKey>(normalizeSound(existing?.reminderSound));
  const [repeatEnabled, setRepeatEnabled] = useState(existing?.repeatEnabled ?? true);
  const [repeatEveryMin, setRepeatEveryMin] = useState(existing?.repeatEveryMin ?? 30);
  const [restDays, setRestDays] = useState<number[]>(existing?.restDays ?? []);
  const [tasks, setTasks] = useState<string[]>(existing?.tasks.map((task) => task.title) ?? []);
  const [taskDraft, setTaskDraft] = useState('');

  const setupValid = title.trim().length > 0 && durationDays >= 1 && restDays.length < 7;
  const tasksValid = tasks.length > 0;

  function shiftTime(minutes: number) {
    const [hour, minute] = reminderTime.split(':').map(Number);
    let total = (hour * 60 + minute + minutes + 24 * 60) % (24 * 60);
    setReminderTime(`${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`);
  }

  function addTask() {
    const value = taskDraft.trim();
    if (!value) return;
    setTasks((current) => [...current, value]);
    setTaskDraft('');
  }

  function moveTask(index: number, direction: -1 | 1) {
    setTasks((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function save() {
    const draft: ChallengeDraft = {
      title,
      durationDays,
      reminderTime,
      reminderSound,
      repeatEnabled,
      repeatEveryMin,
      taskTitles: tasks,
      restDays,
    };
    if (existing) {
      updateChallenge(existing.id, draft);
    } else {
      addChallenge(draft);
    }
    syncInBackground();
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => (step === 'setup' ? navigation.goBack() : setStep(step === 'summary' ? 'tasks' : 'setup'))}
          style={styles.backBtn}
        >
          <BackIcon color={colors.text} size={16} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.text, fontFamily: fonts.display }]}>
          {existing ? 'Edit challenge' : 'New challenge'}
        </Text>
        <View style={styles.stepDots}>
          {(['setup', 'tasks', 'summary'] as Step[]).map((candidate) => (
            <View
              key={candidate}
              style={[
                styles.dot,
                { backgroundColor: candidate === step ? colors.accent : colors.border },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'setup' && (
          <>
            <Field label="What are you calling it?">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. 21-day reset"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontFamily: fonts.body },
                ]}
              />
            </Field>

            <Field label="How many days?">
              <View style={styles.chipRow}>
                {DURATION_PRESETS.map((preset) => (
                  <Chip
                    key={preset}
                    label={`${preset} days`}
                    selected={durationDays === preset && customDuration === ''}
                    onPress={() => {
                      setDurationDays(preset);
                      setCustomDuration('');
                    }}
                  />
                ))}
              </View>
              <TextInput
                value={customDuration}
                onChangeText={(value) => {
                  const digits = value.replace(/[^0-9]/g, '').slice(0, 3);
                  setCustomDuration(digits);
                  if (digits) setDurationDays(Number(digits));
                }}
                placeholder="Custom number of days"
                keyboardType="number-pad"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  { marginTop: 10, backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontFamily: fonts.body },
                ]}
              />
            </Field>

            <Field label="Rest days">
              <Text style={[styles.fieldHint, { color: colors.textMuted, fontFamily: fonts.body, marginTop: 0, marginBottom: 10 }]}>
                Days you plan to take off. No reminder, and they never count against you.
              </Text>
              <View style={styles.chipRow}>
                {WEEKDAY_LABELS.map((day) => {
                  const off = restDays.includes(day.value);
                  return (
                    <Pressable
                      key={day.value}
                      onPress={() =>
                        setRestDays((current) =>
                          off ? current.filter((v) => v !== day.value) : [...current, day.value],
                        )
                      }
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: off ? colors.accent : colors.surface,
                          borderColor: off ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: off ? colors.accentInk : colors.text,
                          fontFamily: fonts.bodyBold,
                          fontSize: 12.5,
                        }}
                      >
                        {day.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {restDays.length >= 7 && (
                <Text style={[styles.fieldHint, { color: colors.danger, fontFamily: fonts.body }]}>
                  Every day can't be a rest day — leave at least one active.
                </Text>
              )}
            </Field>

            <Field label="Daily reminder">
              <View style={[styles.timeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Stepper label="−1h" onPress={() => shiftTime(-60)} />
                <Stepper label="−5m" onPress={() => shiftTime(-5)} />
                <Text style={[styles.timeText, { color: colors.text, fontFamily: fonts.display }]}>
                  {formatTime(reminderTime)}
                </Text>
                <Stepper label="+5m" onPress={() => shiftTime(5)} />
                <Stepper label="+1h" onPress={() => shiftTime(60)} />
              </View>
            </Field>

            <Field label="Reminder sound">
              <View style={styles.chipRow}>
                {SOUND_OPTIONS.map((option) => (
                  <Chip
                    key={option.key}
                    label={option.label}
                    selected={reminderSound === option.key}
                    onPress={() => setReminderSound(option.key)}
                  />
                ))}
              </View>
              <Text style={[styles.fieldHint, { color: colors.textMuted, fontFamily: fonts.body }]}>
                {SOUND_OPTIONS.find((option) => option.key === reminderSound)?.hint}
              </Text>
            </Field>

            <Field label="Nag me again if I miss it">
              <View style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontFamily: fonts.body, fontSize: 14, flex: 1 }}>
                  Repeat until I log the day
                </Text>
                <Switch value={repeatEnabled} onValueChange={setRepeatEnabled} />
              </View>
              {repeatEnabled && (
                <View style={[styles.chipRow, { marginTop: 10 }]}>
                  {REPEAT_PRESETS.map((preset) => (
                    <Chip
                      key={preset}
                      label={`every ${preset} min`}
                      selected={repeatEveryMin === preset}
                      onPress={() => setRepeatEveryMin(preset)}
                    />
                  ))}
                </View>
              )}
            </Field>
          </>
        )}

        {step === 'tasks' && (
          <>
            <Text style={[styles.stepIntro, { color: colors.textMuted, fontFamily: fonts.body }]}>
              List the things you want to do every single day. You'll tick these off each night.
            </Text>

            <View style={{ gap: 8 }}>
              {tasks.map((task, index) => (
                <View
                  key={`${task}-${index}`}
                  style={[styles.taskRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.text, fontFamily: fonts.body, fontSize: 14, flex: 1 }}>{task}</Text>
                  <Pressable onPress={() => moveTask(index, -1)} style={styles.miniBtn}>
                    <Text style={{ color: colors.textMuted, fontFamily: fonts.bodyBold }}>↑</Text>
                  </Pressable>
                  <Pressable onPress={() => moveTask(index, 1)} style={styles.miniBtn}>
                    <Text style={{ color: colors.textMuted, fontFamily: fonts.bodyBold }}>↓</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setTasks((current) => current.filter((_, i) => i !== index))}
                    style={styles.miniBtn}
                  >
                    <Text style={{ color: colors.danger, fontFamily: fonts.bodyBold }}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={[styles.addRow, { marginTop: tasks.length ? 12 : 0 }]}>
              <TextInput
                value={taskDraft}
                onChangeText={setTaskDraft}
                onSubmitEditing={addTask}
                returnKeyType="done"
                placeholder="e.g. Read 20 pages"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  { flex: 1, backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontFamily: fonts.body },
                ]}
              />
              <Pressable onPress={addTask} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
                <PlusIcon color={colors.accentInk} size={16} />
              </Pressable>
            </View>
          </>
        )}

        {step === 'summary' && (
          <>
            <Text style={[styles.stepIntro, { color: colors.textMuted, fontFamily: fonts.body }]}>
              One last look before you start.
            </Text>

            <SummaryCard title="Challenge" onEdit={() => setStep('setup')}>
              <SummaryRow label="Name" value={title.trim()} />
              <SummaryRow label="Length" value={`${durationDays} days`} />
              <SummaryRow label="Rest days" value={restDaysLabel(restDays)} />
              <SummaryRow label="Reminder" value={formatTime(reminderTime)} />
              <SummaryRow label="Sound" value={soundLabel(reminderSound)} />
              <SummaryRow
                label="If missed"
                value={repeatEnabled ? `Repeat every ${repeatEveryMin} min` : 'No repeat'}
              />
            </SummaryCard>

            <SummaryCard title={`Daily list (${tasks.length})`} onEdit={() => setStep('tasks')}>
              {tasks.map((task, index) => (
                <View key={`${task}-${index}`} style={styles.summaryTask}>
                  <CheckIcon color={colors.textMuted} size={13} />
                  <Text style={{ color: colors.text, fontFamily: fonts.body, fontSize: 14 }}>{task}</Text>
                </View>
              ))}
            </SummaryCard>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
        {step === 'summary' ? (
          <PrimaryButton label={existing ? 'Save changes' : 'Start challenge'} onPress={save} enabled />
        ) : (
          <PrimaryButton
            label="Continue"
            enabled={step === 'setup' ? setupValid : tasksValid}
            onPress={() => setStep(step === 'setup' ? 'tasks' : 'summary')}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
    >
      <Text
        style={{
          color: selected ? colors.accentInk : colors.text,
          fontFamily: fonts.bodyBold,
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.stepperBtn, { backgroundColor: colors.surface2 }]}>
      <Text style={{ color: colors.text, fontFamily: fonts.bodyBold, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}

function SummaryCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.summaryHead}>
        <Text style={[styles.summaryTitle, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
        <Pressable onPress={onEdit}>
          <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 13 }}>Edit</Text>
        </Pressable>
      </View>
      <View style={{ gap: 8, marginTop: 10 }}>{children}</View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Text style={{ color: colors.textMuted, fontFamily: fonts.body, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13.5 }}>{value}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress, enabled }: { label: string; onPress: () => void; enabled: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      style={[styles.primaryBtn, { backgroundColor: enabled ? colors.accent : colors.surface2 }]}
    >
      <Text
        style={{ color: enabled ? colors.accentInk : colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 15 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  stepDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  content: { padding: 20, paddingBottom: 40 },
  stepIntro: { fontSize: 13.5, lineHeight: 20, marginBottom: 16 },
  fieldLabel: { fontSize: 12, marginBottom: 8, letterSpacing: 0.3 },
  fieldHint: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  dayChip: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, minWidth: 48, alignItems: 'center' },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 6,
  },
  timeText: { fontSize: 18, flex: 1, textAlign: 'center' },
  stepperBtn: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  miniBtn: { paddingHorizontal: 7, paddingVertical: 3 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryTitle: { fontSize: 15 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryTask: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  footer: { padding: 16, paddingBottom: 30, borderTopWidth: 1 },
  primaryBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
});
