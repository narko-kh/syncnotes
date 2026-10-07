/**
 * نام رویدادهای لحظه‌ای
 * سرور این رویدادها رو به همه‌ی دستگاه‌های همون کاربر می‌فرسته.
 */
export const REALTIME_EVENTS = {
  ITEM_CREATED: 'item:created',
  ITEM_UPDATED: 'item:updated',
  ITEM_DELETED: 'item:deleted',
} as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
