import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, fonts } from '../theme/useTheme';
import { useHabitsStore } from '../store/habitsStore';
import { habitColorVars } from '../theme/colors';
import { HABIT_COLOR_OPTIONS, HABIT_ICON_OPTIONS, HabitIconBubble } from '../components/HabitVisuals';
import { BackIcon } from '../components/icons';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { HabitColorKey, HabitFrequency, HabitIconKey, HabitType } from '../store/types';

const CHALLENGE_LENGTHS = [21, 66, 100];

export default function AddHabitScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const addHabit = useHabitsStore((s) => s.addHabit);
  const startChallenge = useHabitsStore((s) => s.startChallenge);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<HabitType>('BUILD');
  const [frequency, setFrequency] = useState<HabitFrequency>('DAILY');
  const [icon, setIcon] = useState<HabitIconKey>('leaf');
  const [color, setColor] = useState<HabitColorKey>('accent');
  const [challengeLength, setChallengeLength] = useState<number | null>(21);

  function handleCreate() {
    if (!title.trim()) return;
    const habit = addHabit({ title: title.trim(), type, frequency, icon, color });
    if (challengeLength) {
      startChallenge(habit.id, challengeLength);
    }
    navigation.replace('HabitDetail', { habitId: habit.id });
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <BackIcon color={colors.text} size={15} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>New habit</Text>
      </View>

      <Field label="Name">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Evening yoga"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text, fontFamily: fonts.bodyBold }]}
        />
      </Field>

      <Field label="Color">
        <View style={styles.row}>
          {HABIT_COLOR_OPTIONS.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)} style={color === c && [styles.selected, { borderColor: colors.text }]}>
              <HabitIconBubble icon={icon} color={c} colors={colors} size={36} />
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Icon">
        <View style={styles.row}>
          {HABIT_ICON_OPTIONS.map((i) => (
            <Pressable key={i} onPress={() => setIcon(i)} style={icon === i && [styles.selected, { borderColor: colors.text }]}>
              <HabitIconBubble icon={i} color={color} colors={colors} size={36} />
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Type">
        <View style={[styles.segmented, { backgroundColor: colors.surface2 }]}>
          {(['BUILD', 'BREAK'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.seg, type === t && { backgroundColor: colors.surface }]}
            >
              <Text style={{ color: type === t ? colors.text : colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 13 }}>
                {t === 'BUILD' ? 'Build' : 'Break'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Frequency">
        <ChipRow
          options={[
            { value: 'DAILY', label: 'Daily' },
            { value: 'WEEKLY', label: 'Weekly' },
            { value: 'CUSTOM', label: 'Custom' },
          ]}
          value={frequency}
          onChange={(v) => setFrequency(v as HabitFrequency)}
        />
      </Field>

      <Field label="Challenge length">
        <ChipRow
          options={[...CHALLENGE_LENGTHS.map((d) => ({ value: String(d), label: `${d} days` })), { value: 'none', label: 'No challenge' }]}
          value={challengeLength ? String(challengeLength) : 'none'}
          onChange={(v) => setChallengeLength(v === 'none' ? null : Number(v))}
        />
      </Field>

      <Pressable
        onPress={handleCreate}
        disabled={!title.trim()}
        style={[styles.cta, { backgroundColor: colors.accent, opacity: title.trim() ? 1 : 0.5 }]}
      >
        <Text style={[styles.ctaText, { color: colors.accentInk }]}>Create habit</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.label, { color: colors.textMuted, fontFamily: fonts.bodyBold }]}>{label}</Text>
      {children}
    </View>
  );
}

function ChipRow({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.chip,
              {
                borderColor: active ? colors.accent : colors.border,
                backgroundColor: active ? colors.accentTint : 'transparent',
              },
            ]}
          >
            <Text style={{ color: active ? colors.accent : colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 12.5 }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19 },
  label: { fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  selected: { borderRadius: 20, borderWidth: 2 },
  segmented: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  seg: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  cta: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  ctaText: { fontWeight: '700', fontSize: 14.5 },
});
