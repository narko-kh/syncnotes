/**
 * جهت متن (چپ‌به‌راست / راست‌به‌چپ)
 * اندروید و iOS جهت صفحه رو فقط موقع باز شدن اپ می‌خونن،
 * برای همین بعد از عوض کردن زبان باید اپ دوباره بالا بیاد.
 */
import * as Updates from 'expo-updates';
import { DevSettings, I18nManager } from 'react-native';
import type { AppLanguage } from '@/domain/types';

// جهت دلخواه رو ثبت می‌کنه. اگه با جهت فعلی فرق داشته باشه true برمی‌گردونه (یعنی ری‌استارت لازمه)
export function applyDirection(language: AppLanguage): boolean {
  const wantsRtl = language === 'fa';
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(wantsRtl);
  return I18nManager.isRTL !== wantsRtl;
}

// اپ رو دوباره بالا میاره. اگه نشد، کاربر خودش اپ رو می‌بنده و باز می‌کنه.
export async function reloadApp(): Promise<void> {
  try {
    if (__DEV__) {
      DevSettings.reload();
      return;
    }
    await Updates.reloadAsync();
  } catch {
    // ری‌لود خودکار ممکن نبود؛ پیام «اپ رو دوباره باز کن» کافیه
  }
}
