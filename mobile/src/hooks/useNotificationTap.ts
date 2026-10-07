/**
 * باز کردن وظیفه با لمس اعلان
 * هم وقتی اپ بازه و هم وقتی اپ بسته بوده و کاربر با لمس اعلان واردش شده.
 */
import type { NotificationResponse } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { getNotifications } from '@/services/notifications/notificationsModule';

export function useNotificationTap(enabled: boolean): void {
  const router = useRouter();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const Notifications = getNotifications();
    if (!enabled || !Notifications) return;

    const open = (response: NotificationResponse | null) => {
      if (!response) return;
      const { identifier, content } = response.notification.request;

      // یک اعلان رو دوبار باز نمی‌کنیم
      const key = `${identifier}:${response.notification.date}`;
      if (handledRef.current === key) return;
      handledRef.current = key;

      const itemId = content.data?.itemId;
      if (typeof itemId === 'string') router.push({ pathname: '/editor', params: { id: itemId } });
    };

    // اپ بسته بوده و با لمس اعلان باز شده (کمی صبر می‌کنیم تا مسیرها آماده بشن)
    const timer = setTimeout(() => open(Notifications.getLastNotificationResponse()), 0);
    // اپ بازه و کاربر اعلان رو لمس کرد
    const subscription = Notifications.addNotificationResponseReceivedListener(open);

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [enabled, router]);
}