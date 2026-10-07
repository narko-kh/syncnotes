/**
 * زمان‌بندی یادآوری‌ها (اعلان محلی)
 * اعلان‌ها روی خود گوشی ساخته میشن، پس آفلاین هم کار می‌کنن و به سرور اضافه‌ای نیاز نیست.
 * هر بار که وظایف یا زبان عوض بشن، همه‌ی اعلان‌ها از نو ساخته میشن تا همیشه با داده‌ها یکی باشن.
 */
import { Alert, Linking, Platform } from 'react-native';
import type { AppLanguage, Item } from '@/domain/types';
import { i18n } from '@/i18n';
import { useItemsStore } from '@/stores/itemsStore';
import { formatDueDateTime } from '@/utils/format';
import { getNotifications } from './notificationsModule';

// null یعنی تو این محیط (Expo Go اندروید) اعلان پشتیبانی نمیشه
const Notifications = getNotifications();

const CHANNEL_ID = 'reminders';

// iOS بیشتر از ۶۴ اعلان زمان‌بندی‌شده نگه نمی‌داره؛ نزدیک‌ترین‌ها رو زمان‌بندی می‌کنیم
const MAX_SCHEDULED = 60;

// وقتی اپ بازه هم اعلان به‌صورت بنر نشون داده بشه
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// اندروید برای اعلان به «کانال» نیاز داره (اسمش به زبان فعلی اپ نوشته میشه)
async function ensureChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: i18n.t('reminders.channelName'),
    importance: Notifications.AndroidImportance.HIGH,
  });
}

// اجازه‌ی نمایش اعلان رو می‌گیره. اگه کاربر قبلاً رد کرده باشه، به تنظیمات گوشی هدایتش می‌کنه.
export async function ensureReminderPermission(): Promise<boolean> {
  // تو این محیط اعلان نداریم؛ به کاربر میگیم چرا
  if (!Notifications) {
    Alert.alert(i18n.t('reminders.unsupportedTitle'), i18n.t('reminders.unsupportedBody'));
    return false;
  }

  // اندروید ۱۳ بدون کانال، پنجره‌ی درخواست اجازه رو نشون نمیده
  await ensureChannel();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  if (current.canAskAgain) {
    const asked = await Notifications.requestPermissionsAsync();
    if (asked.granted) return true;
  }

  Alert.alert(i18n.t('reminders.permissionTitle'), i18n.t('reminders.permissionBody'), [
    { text: i18n.t('common.cancel'), style: 'cancel' },
    { text: i18n.t('reminders.openSettings'), onPress: () => void Linking.openSettings() },
  ]);
  return false;
}

// یک اعلان برای یک وظیفه؛ شناسه‌ی اعلان همون شناسه‌ی وظیفه‌ست تا تکراری نشه
async function scheduleOne(item: Item, language: AppLanguage): Promise<void> {
  if (!Notifications || !item.remindAt || !item.dueAt) return;

  await Notifications.scheduleNotificationAsync({
    identifier: item.id,
    content: {
      title: item.title,
      body: i18n.t('reminders.body', { date: formatDueDateTime(item.dueAt, language) }),
      data: { itemId: item.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(item.remindAt),
      channelId: CHANNEL_ID,
    },
  });
}

// همه‌ی اعلان‌های قبلی رو پاک می‌کنه و از روی وظایف فعلی از نو می‌سازه
async function rebuild(): Promise<void> {
  if (!Notifications) return;

  const permission = await Notifications.getPermissionsAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!permission.granted) return;

  await ensureChannel();
  const now = Date.now();
  const language: AppLanguage = i18n.language === 'fa' ? 'fa' : 'en';

  const upcoming = Object.values(useItemsStore.getState().items)
    .filter((item) => item.type === 'TASK' && !item.isDone && item.remindAt && Date.parse(item.remindAt) > now)
    .sort((a, b) => Date.parse(a.remindAt as string) - Date.parse(b.remindAt as string))
    .slice(0, MAX_SCHEDULED);

  await Promise.all(upcoming.map((item) => scheduleOne(item, language)));
}

// بازسازی‌ها پشت‌سرهم اجرا میشن تا دوتا بازسازی همزمان همدیگه رو به‌هم نریزن
let queue: Promise<void> = Promise.resolve();
export function rebuildReminders(): Promise<void> {
  queue = queue.then(rebuild).catch(() => undefined);
  return queue;
}

// ───────────── روشن و خاموش کردن ─────────────

let stopWatching: (() => void) | null = null;

// فقط چیزهایی که روی اعلان اثر دارن رو به‌صورت یک متن خلاصه می‌کنیم؛ اگه عوض نشده بود بازسازی نمی‌کنیم
function signatureOf(items: Record<string, Item>): string {
  return Object.values(items)
    .filter((item) => item.type === 'TASK' && !item.isDone && item.remindAt)
    .map((item) => `${item.id}|${item.title}|${item.dueAt}|${item.remindAt}`)
    .sort()
    .join(';');
}

// بعد از ورود کاربر صدا زده میشه
export function startReminders(): void {
  if (stopWatching || !Notifications) return;

  let signature = signatureOf(useItemsStore.getState().items);
  let timer: ReturnType<typeof setTimeout> | null = null;

  // چند تغییر پشت‌سرهم رو یک‌جا (با نیم‌ثانیه تأخیر) پردازش می‌کنیم
  const scheduleRebuild = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void rebuildReminders(), 500);
  };

  const unsubscribeItems = useItemsStore.subscribe((state) => {
    const next = signatureOf(state.items);
    if (next === signature) return;
    signature = next;
    scheduleRebuild();
  });

  // با عوض شدن زبان، متن اعلان‌ها هم باید عوض بشه
  i18n.on('languageChanged', scheduleRebuild);

  stopWatching = () => {
    unsubscribeItems();
    i18n.off('languageChanged', scheduleRebuild);
    if (timer) clearTimeout(timer);
  };

  void rebuildReminders();
}

// موقع خروج از حساب: همه‌ی اعلان‌ها پاک میشن
export async function stopReminders(): Promise<void> {
  stopWatching?.();
  stopWatching = null;
  await Notifications?.cancelAllScheduledNotificationsAsync().catch(() => undefined);
}