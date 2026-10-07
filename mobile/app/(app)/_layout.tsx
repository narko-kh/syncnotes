/**
 * چیدمان صفحه‌های بعد از ورود
 * لیست هدر سفارشی خودش رو داره؛ ویرایشگر و تنظیمات هدر معمولی با عنوان ترجمه‌شده دارن.
 */
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/useTheme';

export default function AppLayout() {
  const { t } = useTranslation();
  const { palette } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="editor" options={{ title: t('editor.newTitle'), presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
    </Stack>
  );
}
