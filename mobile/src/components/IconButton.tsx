/**
 * دکمه‌ی آیکونی
 * ناحیه‌ی لمس ۴۴ پیکسل (استاندارد دسترس‌پذیری) و برچسب برای screen reader.
 */
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { TOUCH_TARGET } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Props {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}

export function IconButton({ icon, label, onPress }: Props) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: TOUCH_TARGET,
        height: TOUCH_TARGET,
        borderRadius: TOUCH_TARGET / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? palette.surfaceAlt : 'transparent',
      })}
    >
      <Ionicons name={icon} size={24} color={palette.text} />
    </Pressable>
  );
}
