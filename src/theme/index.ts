import { Platform, useColorScheme, type ViewStyle } from 'react-native';

// Paleta del documento del proyecto (sección 10), ampliada con un tema oscuro.
const brand = {
  primary: '#02368A',
  secondary: '#0077B6',
  accent: '#00B4D8',
  light: '#90E0EF',
  dark: '#03045E',
};

const light = {
  ...brand,
  background: '#F4F7FC',
  surface: '#FFFFFF',
  surfaceAlt: '#EAF1FA',
  text: '#0B1630',
  textMuted: '#55657E',
  border: '#DCE5F0',
  onPrimary: '#FFFFFF',
  tint: '#02368A',
  success: '#15803D',
  warning: '#C2410C',
  danger: '#B91C1C',
  successBg: '#DCFCE7',
  warningBg: '#FFEDD5',
  dangerBg: '#FEE2E2',
  overlay: 'rgba(3, 4, 94, 0.45)',
  tabBar: 'rgba(255,255,255,0.92)',
  gradient: ['#03045E', '#02368A', '#0077B6'] as readonly [string, string, string],
};

const dark: typeof light = {
  ...brand,
  background: '#060B1E',
  surface: '#0E1631',
  surfaceAlt: '#16213F',
  text: '#EEF3FF',
  textMuted: '#9AA8C4',
  border: '#22305A',
  onPrimary: '#FFFFFF',
  tint: '#4CC9F0',
  success: '#4ADE80',
  warning: '#FB923C',
  danger: '#F87171',
  successBg: 'rgba(74,222,128,0.14)',
  warningBg: 'rgba(251,146,60,0.16)',
  dangerBg: 'rgba(248,113,113,0.16)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  tabBar: 'rgba(14,22,49,0.92)',
  gradient: ['#020314', '#03045E', '#02368A'] as readonly [string, string, string],
};

export type ThemeColors = typeof light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

// Validación de plataforma: iOS usa sombras, Android usa elevation.
export function shadow(level: 1 | 2 | 3 = 1): ViewStyle {
  const map = { 1: [4, 0.08, 10, 3], 2: [8, 0.12, 18, 6], 3: [14, 0.18, 28, 12] } as const;
  const [y, opacity, blur, elevation] = map[level];
  return Platform.select<ViewStyle>({
    ios: { shadowColor: '#03045E', shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: blur },
    android: { elevation },
    default: { boxShadow: `0 ${y}px ${blur}px rgba(3,4,94,${opacity})` } as ViewStyle,
  })!;
}

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? dark : light, isDark };
}
