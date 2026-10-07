/**
 * آماده‌سازی اپ موقع شروع
 * ترتیب مهمه: اول تنظیمات، بعد زبان، بعد آیتم‌های ذخیره‌شده، آخر وضعیت ورود.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyDirection, reloadApp } from '@/i18n/direction';
import { detectDeviceLanguage, initI18n } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useItemsStore } from '@/stores/itemsStore';
import { useSettingsStore } from '@/stores/settingsStore';
// کلیدی که یادمون میاره برای کدوم زبان ری‌استارت خودکار انجام دادیم
const DIRECTION_RELOAD_KEY = 'syncnotes.directionReloadedFor';

export async function bootstrapApp(): Promise<void> {
  // ۱. تنظیمات ذخیره‌شده (زبان و تم)
  await useSettingsStore.persist.rehydrate();
  const language = useSettingsStore.getState().language ?? detectDeviceLanguage();

    // ۲. زبان و جهت متن
  await initI18n(language);
  if (applyDirection(language)) {
    // جهت صفحه فقط با ری‌استارت عوض میشه؛ برای هر زبان یک‌بار خودکار انجام میدیم
    // (قفل، جلوی حلقه‌ی بی‌نهایت ری‌استارت رو می‌گیره)
    const alreadyReloadedFor = await AsyncStorage.getItem(DIRECTION_RELOAD_KEY);
    if (alreadyReloadedFor !== language) {
      await AsyncStorage.setItem(DIRECTION_RELOAD_KEY, language);
      await reloadApp();
    }
  }

  // ۳. آیتم‌ها و صف ارسال که تو گوشی ذخیره شده
  await useItemsStore.persist.rehydrate();

  // ۴. وضعیت ورود (و روشن کردن همگام‌سازی)
  await useAuthStore.getState().bootstrap();
}
