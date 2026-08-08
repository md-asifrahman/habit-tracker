import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from './colors';

export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return { colors, scheme: scheme ?? 'light' };
}

export const fonts = {
  display: 'Fredoka_600SemiBold',
  body: 'Manrope_400Regular',
  bodyBold: 'Manrope_700Bold',
};
