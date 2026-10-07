/**
 * چیدمان اصلی اپ
 * اول اپ آماده میشه (تنظیمات، زبان، داده‌ها، وضعیت ورود)، بعد صفحه‌ها نمایش داده میشن.
 * مسیرهای محافظت‌شده: کاربر وارد نشده فقط صفحه‌های ورود رو می‌بینه و برعکس.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrapApp } from '@/bootstrap';
import { useNotificationTap } from '@/hooks/useNotificationTap';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/useTheme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // حتی اگه آماده‌سازی خطا بده، صفحه‌ی ورود نمایش داده میشه
    bootstrapApp()
      .catch(() => useAuthStore.setState({ status: 'signedOut', user: null }))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppStack />
    </SafeAreaProvider>
  );
}

function AppStack() {
  const { palette, isDark } = useTheme();
  const status = useAuthStore((s) => s.status);

  // با لمس اعلان، وظیفه‌ی مربوطه باز میشه
  useNotificationTap(status === 'signedIn');

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={status !== 'signedIn'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}