/**
 * استور احراز هویت
 * وضعیت ورود کاربر و عملیات ثبت‌نام، ورود و خروج.
 * بعد از ورود موتور همگام‌سازی روشن میشه و بعد از خروج خاموش.
 */
import { create } from 'zustand';
import type { AuthResponse, SessionUser } from '@/domain/types';
import * as authApi from '@/services/api/authApi';
import { onSessionExpired } from '@/services/api/http';
import { clearSession, loadSession, saveSession } from '@/services/storage/secureSession';
import { startSync, stopSync } from '@/services/sync/syncEngine';
import { startReminders, stopReminders } from '@/services/notifications/reminderScheduler';
import { useItemsStore } from './itemsStore';

interface AuthState {
  // loading: هنوز نمی‌دونیم کاربر وارد شده یا نه
  status: 'loading' | 'signedOut' | 'signedIn';
  user: SessionUser | null;
  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  handleSessionExpired: () => Promise<void>;
}

// اگه داده‌های ذخیره‌شده مال کاربر دیگه‌ای بود، پاکشون می‌کنیم
function adoptOwner(userId: string): void {
  const items = useItemsStore.getState();
  if (items.ownerId !== userId) items.reset(userId);
}

// پاک‌سازی محلی بعد از خروج یا تموم شدن نشست
async function clearLocalData(): Promise<void> {
  stopSync();
  await stopReminders();
  await clearSession();
  useItemsStore.getState().reset(null);
}

export const useAuthStore = create<AuthState>((set, get) => {
  // بعد از ورود یا ثبت‌نام موفق
  const establish = async (result: AuthResponse): Promise<void> => {
    await saveSession(result);
    adoptOwner(result.user.id);
    set({ status: 'signedIn', user: result.user });
    startSync();
    startReminders();
  };

  return {
    status: 'loading',
    user: null,

    // موقع شروع اپ: اگه نشست ذخیره‌شده داریم، بدون پرسیدن دوباره وارد میشیم (حتی آفلاین)
    bootstrap: async () => {
      onSessionExpired(() => void get().handleSessionExpired());

      const session = await loadSession();
      if (!session) {
        set({ status: 'signedOut', user: null });
        return;
      }
      adoptOwner(session.user.id);
      set({ status: 'signedIn', user: session.user });
      startSync();
      startReminders();
    },

    signIn: async (email, password) => establish(await authApi.login(email, password)),

    signUp: async (email, password) => establish(await authApi.register(email, password)),

    // خروج: اول به سرور خبر میدیم (اگه نشد مهم نیست) بعد داده‌های محلی رو پاک می‌کنیم
    signOut: async () => {
      stopSync();
      try {
        await authApi.logout();
      } catch {
        // آفلاین بودیم؛ نشست محلی به هر حال پاک میشه
      }
      await clearLocalData();
      set({ status: 'signedOut', user: null });
    },

    // وقتی سرور توکن رفرش رو رد کرد (مثلاً بعد از ۷ روز)
    handleSessionExpired: async () => {
      if (get().status !== 'signedIn') return;
      await clearLocalData();
      set({ status: 'signedOut', user: null });
    },
  };
});
