/**
 * راه‌اندازی چندزبانگی با i18next
 * دو زبان داریم: فارسی (راست‌به‌چپ) و انگلیسی.
 * اگه کاربر زبانی انتخاب نکرده باشه، زبان گوشی رو استفاده می‌کنیم.
 */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { AppLanguage } from '@/domain/types';
import { en } from './en';
import { fa } from './fa';

export { i18n };

// زبان گوشی رو تشخیص میده؛ هر چیزی غیر از فارسی انگلیسی حساب میشه
export function detectDeviceLanguage(): AppLanguage {
  const code = getLocales()[0]?.languageCode;
  return code === 'fa' ? 'fa' : 'en';
}

// فقط یک‌بار موقع شروع اپ صدا زده میشه
export async function initI18n(language: AppLanguage): Promise<void> {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, fa: { translation: fa } },
    lng: language,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React خودش متن‌ها رو امن می‌کنه
  });
}

export function changeLanguage(language: AppLanguage): Promise<unknown> {
  return i18n.changeLanguage(language);
}
