/**
 * فیلد ورودی متن
 * برچسب بالای فیلد، پیام خطا زیرش و حالت فوکوس با رنگ اصلی.
 * trailing برای چیزهایی مثل دکمه‌ی نمایش رمز عبوره.
 */
import { useState, type ReactNode, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
  inputRef?: Ref<TextInput>;
}

export function TextField({ label, error, hint, trailing, inputRef, multiline, style, ...inputProps }: Props) {
  const { palette } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? palette.danger : focused ? palette.accent : palette.border;

  return (
    <View style={styles.wrapper}>
      <Text style={[typography.caption, { color: palette.textMuted }]}>{label}</Text>
      <View style={[styles.field, { backgroundColor: palette.surface, borderColor }]}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          placeholderTextColor={palette.textMuted}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            typography.body,
            { color: palette.text },
            multiline && styles.multiline,
            style,
          ]}
          {...inputProps}
        />
        {trailing}
      </View>
      {error ? (
        <Text style={[typography.caption, { color: palette.danger }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={[typography.caption, { color: palette.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, minHeight: 48, paddingVertical: 10 },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
});
