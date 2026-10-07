/**
 * یک سطر از لیست (وظیفه یا یادداشت)
 * memo شده تا فقط سطرهایی که واقعاً عوض شدن دوباره رندر بشن (لیست روان بمونه).
 * وظیفه‌ها یک چک‌باکس دارن؛ یادداشت‌ها آیکون سند.
 */
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppLanguage, Item } from '@/domain/types';
import { spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatDueDateTime, formatShortDate, getDueStatus } from '@/utils/format';
import { useTranslation } from 'react-i18next';

interface Props {
  item: Item;
  isPending: boolean;
  language: AppLanguage;
  onPress: (id: string) => void;
  onToggle: (id: string, isDone: boolean) => void;
  onLongPress: (id: string) => void;
}

function ItemRowComponent({ item, isPending, language, onPress, onToggle, onLongPress }: Props) {
  const { palette } = useTheme();
  const { t } = useTranslation();
  const isTask = item.type === 'TASK';
  // رنگ موعد: گذشته قرمز، امروز زرد، بقیه خاکستری. وظیفه‌ی انجام‌شده رنگی نمیشه.
  const dueStatus = item.dueAt ? getDueStatus(item.dueAt) : null;
  const dueColor =
    item.isDone || !dueStatus || dueStatus === 'upcoming'
      ? palette.textMuted
      : dueStatus === 'overdue'
        ? palette.danger
        : palette.warning;

  return (
    <Pressable
      onPress={() => onPress(item.id)}
      onLongPress={() => onLongPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? palette.surfaceAlt : palette.surface, borderColor: palette.border },
      ]}
    >
      {/* ستون راهنما: چک‌باکس وظیفه یا آیکون یادداشت */}
      {isTask ? (
        <Pressable
          onPress={() => onToggle(item.id, item.isDone)}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityLabel={item.isDone ? t('list.markOpen') : t('list.markDone')}
          accessibilityState={{ checked: item.isDone }}
          style={[
            styles.checkbox,
            {
              borderColor: item.isDone ? palette.accent : palette.textMuted,
              backgroundColor: item.isDone ? palette.accent : 'transparent',
            },
          ]}
        >
          {item.isDone ? <Ionicons name="checkmark" size={16} color={palette.onAccent} /> : null}
        </Pressable>
      ) : (
        <View style={styles.noteIcon}>
          <Ionicons name="document-text-outline" size={24} color={palette.accent} />
        </View>
      )}

      <View style={styles.body}>
        <Text
          numberOfLines={2}
          style={[
            typography.bodyStrong,
            {
              color: item.isDone ? palette.textMuted : palette.text,
              textDecorationLine: item.isDone ? 'line-through' : 'none',
            },
          ]}
        >
          {item.title}
        </Text>

        {item.content ? (
          <Text numberOfLines={1} style={[typography.body, { color: palette.textMuted }]}>
            {item.content}
          </Text>
        ) : null}

        <View style={styles.meta}>
          <Text style={[typography.caption, { color: palette.textMuted }]}>
            {formatShortDate(item.updatedAt, language)}
          </Text>
          {item.dueAt ? (
            <View style={styles.dueBadge}>
              <Ionicons name={item.remindAt ? 'alarm-outline' : 'calendar-outline'} size={14} color={dueColor} />
              <Text style={[typography.caption, { color: dueColor }]}>
                {dueStatus === 'overdue' && !item.isDone ? `${t('list.overdue')} · ` : ''}
                {formatDueDateTime(item.dueAt, language)}
              </Text>
            </View>
          ) : null}
          {item.tags.slice(0, 3).map((tag) => (
            <Text key={tag} style={[typography.caption, { color: palette.accent }]}>
              #{tag}
            </Text>
          ))}
          {isPending ? (
            <Ionicons
              name="cloud-upload-outline"
              size={16}
              color={palette.warning}
              accessibilityLabel={t('list.waitingToSync')}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const ItemRow = memo(ItemRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 26,
    height: 26,
    marginTop: 2,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteIcon: { width: 26, marginTop: 1, alignItems: 'center' },
  body: { flex: 1, gap: 2 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
});
