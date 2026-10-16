/**
 * Single source of truth for colour, spacing and type.
 * Every screen and component reads from here so the app keeps one visual system.
 */
export const colors = {
  primary: '#3F51B5',
  primaryDark: '#2C3A8C',
  primarySoft: '#E8EAF8',
  background: '#F6F7FB',
  surface: '#FFFFFF',
  border: '#E2E4EE',
  text: '#1B1D29',
  textMuted: '#6B6F85',
  textInverse: '#FFFFFF',
  danger: '#D93D3D',
  dangerSoft: '#FCE8E8',
  success: '#2E9E5B',
  successSoft: '#E3F5EA',
  warning: '#E08A00',
  warningSoft: '#FFF3DC',
} as const;

/** Colours a user can pick for a project. Stored in the database as hex strings. */
export const projectColors = ['#3F51B5', '#00897B', '#E53935', '#F4511E', '#8E24AA', '#5D4037'] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 19, fontWeight: '700' as const, color: colors.text },
  subheading: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
} as const;

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;
