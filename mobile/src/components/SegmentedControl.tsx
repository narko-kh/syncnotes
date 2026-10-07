/**
 * کنترل بخش‌بخش (مثل تب‌های کوچک)
 * برای فیلتر نوع آیتم، انتخاب زبان و تم استفاده میشه.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
}: Props<T>) {
  const { palette } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: palette.surfaceAlt, opacity: disabled ? 0.55 : 1 }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled }}
            style={[styles.segment, selected && { backgroundColor: palette.surface }]}
          >
            <Text
              style={[
                typography.caption,
                { color: selected ? palette.accent : palette.textMuted, fontWeight: selected ? '700' : '500' },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md - 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
