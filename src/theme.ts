import { Platform, ViewStyle } from 'react-native';

export const colors = {
  // Primary: rosso corallo caldo per CTA, toggle attivi e accenti.
  primary: '#E5484D',
  primaryDark: '#9F1D15',
  primarySoft: '#FDECEC',
  // Estremi del gradiente emergenza (corallo -> bordeaux).
  gradientStart: '#E5484D',
  gradientEnd: '#9F1D15',

  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',

  text: '#1A1A1A',
  muted: '#6B7280',

  border: '#ECEEF1',
  borderStrong: '#D1D5DB',

  success: '#166534',
  successBg: '#DCFCE7',
  warning: '#92400E',
  warningBg: '#FEF3C7',
  danger: '#E5484D',
  dangerBg: '#FDECEC',
  info: '#1D4ED8',
  infoBg: '#DBEAFE',

  // Accenti di categoria per le card di idoneita (sangue / plasma / piastrine).
  plasma: '#D97706',
  plasmaBg: '#FEF3C7',
  platelet: '#7C3AED',
  plateletBg: '#EDE9FE',
};

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 22,
  pill: 999,
};

// Ombre morbide e cross-platform (shadow* su iOS, elevation su Android).
export const shadows: Record<'soft' | 'card' | 'elevated', ViewStyle> = {
  soft: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,
  card: Platform.select({
    ios: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,
  elevated: Platform.select({
    ios: { shadowColor: '#9F1D15', shadowOpacity: 0.28, shadowRadius: 22, shadowOffset: { width: 0, height: 12 } },
    android: { elevation: 10 },
    default: {},
  }) as ViewStyle,
};
