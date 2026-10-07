/**
 * تنظیمات کاربر (زبان و تم)
 * تو حافظه‌ی گوشی ذخیره میشه تا با بستن اپ از بین نره.
 * skipHydration: خودمون موقع شروع اپ و به ترتیب درست مقدارها رو می‌خونیم.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppLanguage, ThemeMode } from '@/domain/types';

interface SettingsState {
  // null یعنی کاربر انتخاب نکرده و از زبان گوشی استفاده میشه
  language: AppLanguage | null;
  themeMode: ThemeMode;
  setLanguage: (language: AppLanguage) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: null,
      themeMode: 'system',
      setLanguage: (language) => set({ language }),
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: 'syncnotes.settings',
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      partialize: (state) => ({ language: state.language, themeMode: state.themeMode }),
    },
  ),
);
