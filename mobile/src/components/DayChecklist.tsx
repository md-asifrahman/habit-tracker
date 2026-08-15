import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts, useTheme } from '../theme/useTheme';
import { ProgressBar } from './ChallengeVisuals';
import { CheckIcon } from './icons';
import type { Challenge, DayLog } from '../store/types';

/**
 * Ticking off one day of a challenge. Shared by the Today card and the screen for filling in a
 * day you missed, so both behave identically — including the "Select all" shortcut and the note.
 */
export function DayChecklist({
  challenge,
  saved,
  onSave,
  saveLabel = 'Save',
  children,
}: {
  challenge: Challenge;
  saved: DayLog | undefined;
  onSave: (completedTaskIds: string[], note: string) => void;
  saveLabel?: string;
  /** Extra controls rendered to the left of the save button. */
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const [checked, setChecked] = useState<string[]>(saved?.completedTaskIds ?? []);
  const [note, setNote] = useState(saved?.note ?? '');

  const total = challenge.tasks.length;
  const done = checked.length;
  const pct = total === 0 ? 0 : Math.round((done * 100) / total);
  const allChecked = total > 0 && done === total;
  const dirty = !saved || !sameSet(checked, saved.completedTaskIds) || note !== (saved.note ?? '');

  return (
    <>
      <View style={{ gap: 2, marginTop: 12 }}>
        {challenge.tasks.map((task) => {
          const on = checked.includes(task.id);
          return (
            <Pressable
              key={task.id}
              onPress={() =>
                setChecked((current) =>
                  current.includes(task.id) ? current.filter((id) => id !== task.id) : [...current, task.id],
                )
              }
              style={styles.taskRow}
            >
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

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Add a note (optional)"
        placeholderTextColor={colors.textMuted}
        multiline
        style={[
          styles.note,
          { backgroundColor: colors.bg, borderColor: colors.border, color: colors.text, fontFamily: fonts.body },
        ]}
      />

      <View style={{ marginTop: 12 }}>
        <ProgressBar value={pct} color={colors.accent} trackColor={colors.surface2} />
      </View>

      <View style={styles.actionRow}>
        {children}
        <Pressable
          onPress={() => onSave(checked, note.trim())}
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
            {dirty ? `${saveLabel} — ${pct}%` : `Saved · ${pct}%`}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

const styles = StyleSheet.create({
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
  note: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    minHeight: 44,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  saveBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
