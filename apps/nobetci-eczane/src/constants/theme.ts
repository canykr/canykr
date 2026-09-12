/**
 * Uygulama genelinde kullanılan renkler, tipografi ve boşluk ölçüleri.
 * Renkler açık ve koyu tema için ayrı ayrı tanımlanır.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1220',
    background: '#F6F7F9',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E3ECFB',
    textSecondary: '#5B6472',
    border: '#E2E5EA',
    primary: '#1F7A4D',
    primaryText: '#FFFFFF',
    danger: '#C0392B',
    warning: '#B8730B',
    success: '#1F7A4D',
    accent: '#2563EB',
  },
  dark: {
    text: '#F4F6F8',
    background: '#0B0F14',
    backgroundElement: '#161B22',
    backgroundSelected: '#1E2A3A',
    textSecondary: '#9BA4B0',
    border: '#262D36',
    primary: '#3FBF7F',
    primaryText: '#04140C',
    danger: '#F0685A',
    warning: '#E3A33C',
    success: '#3FBF7F',
    accent: '#5B9BFF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 20,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
