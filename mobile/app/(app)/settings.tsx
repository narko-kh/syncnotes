/**
 * تنظیمات: زبان، ظاهر (تم) و حساب کاربری
 * عوض کردن زبان فوراً متن‌ها رو عوض می‌کنه؛ جهت صفحه (RTL/LTR) بعد از راه‌اندازی دوباره‌ی اپ اعمال میشه.
 */
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import type { AppLanguage, ThemeMode } from '@/domain/types';
import { applyDirection, reloadApp } from '@/i18n/direction';
import { changeLanguage } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useItemsStore } from '@/stores/itemsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { palette } = useTheme();

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const pendingCount = useItemsStore((s) => s.outbox.length);

  const currentLanguage: AppLanguage = i18n.language === 'fa' ? 'fa' : 'en';

  // عوض کردن زبان: متن‌ها فوراً، جهت صفحه بعد از ری‌استارت
  const handleLanguage = async (next: AppLanguage) => {
    if (next === currentLanguage) return;
    setLanguage(next);
    await changeLanguage(next);

    const needsRestart = applyDirection(next);
    if (needsRestart) {
      // از i18n.t استفاده می‌کنیم چون t همین رندر هنوز زبان قبلیه
      Alert.alert(i18n.t('settings.restartTitle'), i18n.t('settings.restartBody'), [
        { text: i18n.t('settings.later'), style: 'cancel' },
        { text: i18n.t('settings.restartNow'), onPress: () => void reloadApp() },
      ]);
    }
  };

  // خروج با تأیید؛ اگه تغییر ارسال‌نشده داریم هشدار میدیم
  const handleSignOut = () => {
    const body =
      pendingCount > 0
        ? `${t('settings.signOutBody')}\n\n${t('settings.signOutPendingBody', { count: pendingCount })}`
        : t('settings.signOutBody');

    Alert.alert(t('settings.signOutTitle'), body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.signOut'), style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[typography.caption, { color: palette.textMuted }]}>{t('settings.language')}</Text>
          <SegmentedControl<AppLanguage>
            accessibilityLabel={t('settings.language')}
            value={currentLanguage}
            onChange={handleLanguage}
            options={[
              { value: 'fa', label: 'فارسی' },
              { value: 'en', label: 'English' },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[typography.caption, { color: palette.textMuted }]}>{t('settings.theme')}</Text>
          <SegmentedControl<ThemeMode>
            accessibilityLabel={t('settings.theme')}
            value={themeMode}
            onChange={setThemeMode}
            options={[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={[typography.caption, { color: palette.textMuted }]}>{t('settings.account')}</Text>
          <Text style={[typography.bodyStrong, { color: palette.text }]} selectable>
            {user?.email}
          </Text>
          <Button label={t('settings.signOut')} variant="danger" onPress={handleSignOut} />
        </View>

        <Text style={[typography.caption, { color: palette.textMuted, textAlign: 'center' }]}>
          {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
});
