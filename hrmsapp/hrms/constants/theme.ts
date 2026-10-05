/**
 * HRMS Design System — "Refined Indigo"
 *
 * A modern, premium HR/fintech aesthetic: a confident indigo→violet primary,
 * a calm slate neutral ramp, soft layered depth, and generous rounded surfaces.
 *
 * Colors keeps every legacy key (text, tint, icon, success/warning/error, card*,
 * pending/approved/rejected, pugmark*) so existing screens keep working while
 * inheriting the refreshed values. New work should also reach for the design
 * tokens exported below: Radius, Spacing, Shadows, Gradients, Type.
 */

import { Platform } from 'react-native';

// ── Brand ────────────────────────────────────────────────────────────────
const indigo = '#4F46E5'; // primary
const indigoDeep = '#4338CA'; // primary pressed / gradient tail
const violet = '#7C3AED'; // gradient partner
const indigoSoft = '#818CF8'; // primary on dark surfaces

// Semantic (kept aligned with the many inline hexes used across screens)
const green = '#10B981';
const amber = '#F59E0B';
const red = '#EF4444';

// Legacy Pugmark brand hooks (still referenced in a few components)
const pugmarkRed = red;
const pugmarkOrange = amber;
const pugmarkGreen = green;
const pugmarkBlue = indigo;
const pugmarkDarkGrey = '#334155';

export const Colors = {
  light: {
    text: '#0F172A', // slate-900 ink
    textMuted: '#64748B', // slate-500
    background: '#F5F6FB', // soft indigo-tinted canvas
    backgroundSecondary: '#EDEFF7',
    surface: '#FFFFFF',
    tint: indigo,
    tintDark: indigoDeep,
    tintSoft: '#EEF0FE', // tinted chip / selected background
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: indigo,
    // Status
    success: green,
    warning: amber,
    error: red,
    info: indigo,
    // Cards
    cardBackground: '#FFFFFF',
    cardBorder: '#E9ECF4',
    hairline: '#EEF1F7',
    // Status tags
    pending: amber,
    approved: green,
    rejected: red,
    inProgress: amber,
    inReview: indigo,
    // Calendar
    calendarSelected: indigo,
    calendarToday: indigo,
    // Pugmark brand colors (legacy)
    pugmarkRed,
    pugmarkOrange,
    pugmarkGreen,
    pugmarkBlue,
    pugmarkDarkGrey,
  },
  dark: {
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    background: '#0B1020', // deep slate-indigo canvas
    backgroundSecondary: '#141A2E',
    surface: '#151B2E',
    tint: indigoSoft,
    tintDark: indigo,
    tintSoft: '#1E2544',
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: indigoSoft,
    success: green,
    warning: amber,
    error: red,
    info: indigoSoft,
    cardBackground: '#151B2E',
    cardBorder: '#243049',
    hairline: '#1E263C',
    pending: amber,
    approved: green,
    rejected: red,
    inProgress: amber,
    inReview: indigoSoft,
    calendarSelected: indigoSoft,
    calendarToday: indigoSoft,
    pugmarkRed,
    pugmarkOrange,
    pugmarkGreen,
    pugmarkBlue,
    pugmarkDarkGrey,
  },
};

// ── Design tokens ─────────────────────────────────────────────────────────

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/** Multi-stop gradients for hero surfaces and primary actions. */
export const Gradients = {
  primary: ['#6366F1', '#4F46E5', '#4338CA'],
  brand: ['#4F46E5', '#7C3AED'], // indigo → violet
  brandDark: ['#4338CA', '#6D28D9'],
  success: ['#34D399', '#10B981'],
  amber: ['#FBBF24', '#F59E0B'],
  rose: ['#FB7185', '#E11D48'],
  night: ['#1E293B', '#0F172A'],
  sky: ['#38BDF8', '#4F46E5'],
} as const;

/** Soft, layered elevation. Spread into a style object. */
export const Shadows = {
  none: {},
  soft: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  lifted: {
    shadowColor: '#312E81',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  primaryGlow: {
    shadowColor: indigo,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

/** Type scale — sizes, weights, and tracking for a confident hierarchy. */
export const Type = {
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.4 },
  h2: { fontSize: 21, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  micro: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8 }, // tracked-out label
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
