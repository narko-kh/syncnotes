/**
 * طراحی بصری اپ (رنگ، فاصله، گوشه‌ها، تایپوگرافی)
 * همه‌ی رنگ‌ها از اینجا میان تا تم تاریک/روشن یک‌دست بمونه.
 * رنگ اصلی آبی کبالتی هست که به معنی «همگام»‌بودنه؛ فقط روی چیزهای مهم استفاده میشه.
 */
import type { TextStyle } from 'react-native';

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
}

export const lightPalette: Palette = {
  background: '#F3F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#E9EEF5',
  text: '#14202E',
  textMuted: '#5E6E82',
  border: '#DCE3EC',
  accent: '#2F5BEA',
  accentSoft: '#E6ECFD',
  onAccent: '#FFFFFF',
  success: '#1B8F62',
  warning: '#A86A0C',
  danger: '#C93B3B',
};

export const darkPalette: Palette = {
  background: '#0E141B',
  surface: '#17202A',
  surfaceAlt: '#212C38',
  text: '#E8EEF5',
  textMuted: '#94A3B5',
  border: '#2A3745',
  accent: '#7C9AFF',
  accentSoft: '#1E2B55',
  onAccent: '#0E141B',
  success: '#3DC98F',
  warning: '#E3A94B',
  danger: '#F07575',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

// کمترین اندازه‌ی ناحیه‌ی لمس (برای دسترس‌پذیری)
export const TOUCH_TARGET = 44;

export const typography: Record<'title' | 'heading' | 'body' | 'bodyStrong' | 'caption', TextStyle> = {
  title: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  heading: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
};
