/**
 * هوک تم
 * بر اساس انتخاب کاربر (سیستم/روشن/تاریک) پالت رنگ درست رو برمی‌گردونه.
 */
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { darkPalette, lightPalette, type Palette } from './tokens';

export interface Theme {
  palette: Palette;
  isDark: boolean;
}

export function useTheme(): Theme {
  const mode = useSettingsStore((s) => s.themeMode);
  const system = useColorScheme();

  return useMemo(() => {
    const scheme = mode === 'system' ? (system ?? 'light') : mode;
    const isDark = scheme === 'dark';
    return { isDark, palette: isDark ? darkPalette : lightPalette };
  }, [mode, system]);
}
