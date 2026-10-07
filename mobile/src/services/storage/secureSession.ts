/**
 * ذخیره‌ی امن نشست (توکن‌ها و کاربر)
 * از Keychain (iOS) و Keystore (اندروید) استفاده میکنه، نه حافظه‌ی عادی.
 * یک کپی هم تو حافظه نگه می‌داریم تا هر درخواست نیاز به خوندن دیسک نداشته باشه.
 */
import * as SecureStore from 'expo-secure-store';
import type { AuthResponse } from '@/domain/types';

const SESSION_KEY = 'syncnotes.session';

export type StoredSession = AuthResponse;

// undefined یعنی هنوز از دیسک نخوندیم
let cache: StoredSession | null | undefined;

// نشست ذخیره‌شده رو از دیسک می‌خونه (موقع شروع اپ)
export async function loadSession(): Promise<StoredSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    cache = raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    // اگه فایل خراب بود، مثل «وارد نشده» رفتار می‌کنیم
    cache = null;
  }
  return cache;
}

export async function saveSession(session: StoredSession): Promise<void> {
  cache = session;
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  cache = null;
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

// نشست فعلی از حافظه (بدون خوندن دیسک)
export function getCachedSession(): StoredSession | null {
  return cache ?? null;
}
