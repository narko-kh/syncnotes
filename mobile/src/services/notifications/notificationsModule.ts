/**
 * دسترسی امن به expo-notifications
 * از SDK 53 به بعد، این پکیج داخل Expo Go روی اندروید همون لحظه‌ی import خطا میده
 * و کل اپ از کار میفته. برای همین پکیج رو فقط وقتی لود می‌کنیم که محیط پشتیبانی کنه.
 * (تو development build یا اپ نصب‌شده و همچنین iOS مشکلی نیست.)
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsApi = typeof import('expo-notifications');

// Expo Go روی اندروید = پشتیبانی نمیشه
export const isNotificationsSupported = !(
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
);

let cached: NotificationsApi | null | undefined;

// ماژول اعلان‌ها رو برمی‌گردونه، یا null اگه تو این محیط قابل استفاده نیست
export function getNotifications(): NotificationsApi | null {
  if (!isNotificationsSupported) return null;

  if (cached === undefined) {
    try {
      cached = require('expo-notifications') as NotificationsApi;
    } catch {
      cached = null;
    }
  }
  return cached;
}