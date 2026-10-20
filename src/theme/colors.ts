export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  onAccent: string;
  danger: string;
  success: string;
};

/** Placeholder palette until the final branding exists (Q22). */
export const colors: Record<ColorScheme, ThemeColors> = {
  light: {
    background: '#FFFFFF',
    surface: '#F2F1F7',
    text: '#14121F',
    textMuted: '#5E5A70',
    border: '#DDDAE8',
    accent: '#6B4EFF',
    onAccent: '#FFFFFF',
    danger: '#C62828',
    success: '#2E7D32',
  },
  dark: {
    background: '#0D0B14',
    surface: '#1B1826',
    text: '#F2F0FA',
    textMuted: '#A29DB8',
    border: '#2E2A3D',
    accent: '#9C8CFF',
    onAccent: '#0D0B14',
    danger: '#FF6B6B',
    success: '#66BB6A',
  },
};
