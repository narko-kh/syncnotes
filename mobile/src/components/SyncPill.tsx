/**
 * نشانگر وضعیت همگام‌سازی (مهم‌ترین عنصر بصری اپ)
 * کاربر همیشه می‌بینه: زنده‌ایم، آفلاینیم، در حال همگام‌سازی‌ایم یا چند تغییر منتظر ارسال‌اند.
 */
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useItemsStore } from '@/stores/itemsStore';
import { useSyncStore } from '@/stores/syncStore';
import { radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export function SyncPill() {
  const { t } = useTranslation();
  const { palette } = useTheme();

  const isOnline = useSyncStore((s) => s.isOnline);
  const isSocketConnected = useSyncStore((s) => s.isSocketConnected);
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const pendingCount = useItemsStore((s) => s.outbox.length);

  // اولویت وضعیت‌ها: آفلاین > در حال همگام‌سازی > منتظر ارسال > زنده > در حال اتصال
  let label: string;
  let color: string;
  if (!isOnline) {
    label = pendingCount > 0 ? `${t('sync.offline')} · ${t('sync.pending', { count: pendingCount })}` : t('sync.offline');
    color = palette.textMuted;
  } else if (isSyncing) {
    label = t('sync.syncing');
    color = palette.accent;
  } else if (pendingCount > 0) {
    label = t('sync.pending', { count: pendingCount });
    color = palette.warning;
  } else if (isSocketConnected) {
    label = t('sync.live');
    color = palette.success;
  } else {
    label = t('sync.connecting');
    color = palette.warning;
  }

  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={label}
      style={[styles.pill, { backgroundColor: palette.surface, borderColor: palette.border }]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[typography.caption, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
