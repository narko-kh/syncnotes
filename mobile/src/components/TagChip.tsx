/**
 * برچسب (تگ)
 * هم برای نمایش، هم برای فیلتر (انتخاب‌شونده) و هم برای حذف تو ویرایشگر.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { radius, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}

export function TagChip({ label, selected = false, onPress, onRemove, removeLabel }: Props) {
  const { palette } = useTheme();
  const interactive = !!onPress || !!onRemove;

  return (
    <Pressable
      disabled={!interactive}
      onPress={onRemove ?? onPress}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={onRemove ? removeLabel : `#${label}`}
      accessibilityState={{ selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        backgroundColor: selected ? palette.accent : palette.accentSoft,
      }}
    >
      <Text style={[typography.caption, { color: selected ? palette.onAccent : palette.accent }]}>#{label}</Text>
      {onRemove ? <Ionicons name="close" size={14} color={palette.accent} /> : null}
    </Pressable>
  );
}
