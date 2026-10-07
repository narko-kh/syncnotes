/**
 * فیلد انتخاب تاریخ و ساعت
 * از انتخاب‌گر خود سیستم استفاده می‌کنه، پس تو هر پلتفرم ظاهر بومی داره:
 *  - iOS: انتخاب‌گر فشرده‌ی «تاریخ + ساعت» کنار فیلد نشون داده میشه
 *  - اندروید: اول پنجره‌ی تاریخ و بعد پنجره‌ی ساعت باز میشه
 * تاریخ‌ها به زبان اپ نمایش داده میشن (فارسی: شمسی، انگلیسی: میلادی).
 */
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatDueDateTime } from '@/utils/format';

interface Props {
  label: string;
  value: string | null;
  placeholder: string;
  clearLabel: string;
  onChange: (iso: string | null) => void;
}

// وقتی کاربر تازه می‌خواد موعد بذاره: یک ساعت دیگه، با دقیقه‌ی صفر
function defaultDate(): Date {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date;
}

export function DateTimeField({ label, value, placeholder, clearLabel, onChange }: Props) {
  const { palette, isDark } = useTheme();
  const { i18n } = useTranslation();
  const language = i18n.language === 'fa' ? 'fa' : 'en';

  const current = value ? new Date(value) : defaultDate();
  const displayText = value ? formatDueDateTime(value, language) : placeholder;

  // اندروید: اول تاریخ، بعد ساعت، بعد ترکیبشون رو ثبت می‌کنیم
  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: current,
      mode: 'date',
      onChange: (dateEvent, pickedDate) => {
        if (dateEvent.type !== 'set' || !pickedDate) return;

        DateTimePickerAndroid.open({
          value: pickedDate,
          mode: 'time',
          onChange: (timeEvent, pickedTime) => {
            if (timeEvent.type !== 'set' || !pickedTime) return;
            const merged = new Date(pickedDate);
            merged.setHours(pickedTime.getHours(), pickedTime.getMinutes(), 0, 0);
            onChange(merged.toISOString());
          },
        });
      },
    });
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[typography.caption, { color: palette.textMuted }]}>{label}</Text>

      <View style={[styles.field, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Ionicons name="calendar-outline" size={22} color={palette.textMuted} />

        {value && Platform.OS === 'ios' ? (
          // iOS: وقتی موعد داریم، خود انتخاب‌گر فشرده نمایش داده میشه
          <View style={styles.iosPicker}>
            <DateTimePicker
              value={current}
              mode="datetime"
              display="compact"
              locale={language === 'fa' ? 'fa-IR' : 'en-US'}
              themeVariant={isDark ? 'dark' : 'light'}
              onChange={(_event, picked) => {
                if (picked) onChange(picked.toISOString());
              }}
            />
          </View>
        ) : (
          <Pressable
            style={styles.valueButton}
            onPress={Platform.OS === 'ios' ? () => onChange(defaultDate().toISOString()) : openAndroidPicker}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${displayText}`}
          >
            <Text style={[typography.body, { color: value ? palette.text : palette.textMuted }]}>{displayText}</Text>
          </Pressable>
        )}

        {value ? (
          <Pressable onPress={() => onChange(null)} hitSlop={12} accessibilityRole="button" accessibilityLabel={clearLabel}>
            <Ionicons name="close-circle" size={22} color={palette.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  valueButton: { flex: 1, minHeight: 48, justifyContent: 'center' },
  iosPicker: { flex: 1, alignItems: 'flex-start' },
});