export const lightColors = {
  bg: '#F5F1FC',
  surface: '#FFFFFF',
  surface2: '#F1ECFA',
  border: '#E3DBF2',
  text: '#201C2E',
  textMuted: '#6E6584',
  accent: '#6C4CD6',
  accentInk: '#FFFFFF',
  accentTint: '#EDE7FB',
  teal: '#16948A',
  tealTint: '#DEF3F0',
  coral: '#E85D50',
  coralTint: '#FCE4E1',
  amber: '#C98423',
  amberTint: '#F8E9D2',
  success: '#2E9E5B',
  danger: '#D6455A',
};

export const darkColors: typeof lightColors = {
  bg: '#15121F',
  surface: '#1E1A2C',
  surface2: '#262138',
  border: '#362F4C',
  text: '#F1EDFA',
  textMuted: '#A79BC4',
  accent: '#A78BFA',
  accentInk: '#1B1530',
  accentTint: '#2C2545',
  teal: '#3FD4C4',
  tealTint: '#1B3733',
  coral: '#FF8B80',
  coralTint: '#3A2229',
  amber: '#F0B34D',
  amberTint: '#3A2E17',
  success: '#4ADE94',
  danger: '#FF7B8A',
};

export type ThemeColors = typeof lightColors;

export type HabitColorKey = 'accent' | 'teal' | 'coral' | 'amber';

export function habitColorVars(colors: ThemeColors, key: HabitColorKey) {
  const map: Record<HabitColorKey, { tint: string; solid: string }> = {
    accent: { tint: colors.accentTint, solid: colors.accent },
    teal: { tint: colors.tealTint, solid: colors.teal },
    coral: { tint: colors.coralTint, solid: colors.coral },
    amber: { tint: colors.amberTint, solid: colors.amber },
  };
  return map[key];
}
