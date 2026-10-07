/**
 * دکمه
 * چهار حالت داره: اصلی، ثانویه، خطرناک و ساده.
 * ارتفاع حداقل ۴۸ و هنگام بارگذاری غیرفعاله تا دوبار کلیک نشه.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { radius, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false }: Props) {
  const { palette } = useTheme();
  const isDisabled = disabled || loading;

  const background =
    variant === 'primary' ? palette.accent : variant === 'secondary' ? palette.surfaceAlt : 'transparent';
  const color =
    variant === 'primary' ? palette.onAccent : variant === 'danger' ? palette.danger : palette.text;
  const borderColor = variant === 'danger' ? palette.danger : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background, borderColor, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[typography.bodyStrong, { color }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
