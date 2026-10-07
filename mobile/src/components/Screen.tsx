/**
 * قاب صفحه
 * رنگ پس‌زمینه‌ی تم رو میده و محتوا رو از ناحیه‌های سیستمی (ناچ، نوار پایین) دور نگه می‌داره.
 */
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

interface Props {
  children: ReactNode;
  // صفحه‌هایی که هدر خودشون رو دارن، لبه‌ی بالا رو نمیخوان
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, edges = ['top', 'bottom', 'left', 'right'], style }: Props) {
  const { palette } = useTheme();
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: palette.background }, style]}>
      {children}
    </SafeAreaView>
  );
}
