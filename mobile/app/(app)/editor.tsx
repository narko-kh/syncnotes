/**
 * ویرایشگر: ساخت و ویرایش وظیفه/یادداشت
 * اگه پارامتر id داشته باشه حالت ویرایشه، وگرنه آیتم جدید.
 * ذخیره فوری روی نسخه‌ی محلی انجام میشه و همگام‌سازی تو پس‌زمینه میره.
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TagChip } from '@/components/TagChip';
import { TextField } from '@/components/TextField';
import type { ItemType } from '@/domain/types';
import { useItemsStore } from '@/stores/itemsStore';
import { spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { normalizeTags } from '@/utils/validation';
import { DateTimeField } from '@/components/DateTimeField';
import { ensureReminderPermission } from '@/services/notifications/reminderScheduler';
import { computeRemindAt, detectOffset, type ReminderOffset } from '@/utils/reminders';

export default function EditorScreen() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const existing = useItemsStore((s) => (id ? s.items[id] : undefined));
  const isEditing = !!id;

  // مقدار اولیه‌ی فرم از آیتم فعلی (فقط بار اول)
  const [type, setType] = useState<ItemType>(existing?.type ?? 'TASK');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [isDone, setIsDone] = useState(existing?.isDone ?? false);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  // موعد انجام و زمان یادآوری (فقط برای وظیفه‌ها)
  const [dueAt, setDueAt] = useState<string | null>(existing?.dueAt ?? null);
  const [offset, setOffset] = useState<ReminderOffset>(detectOffset(existing?.dueAt, existing?.remindAt));

  // اگه تو حال ویرایش بودیم و آیتم جای دیگه (یا از همین صفحه) حذف شد، برمی‌گردیم
  const leavingRef = useRef(false);
  useEffect(() => {
    if (isEditing && !existing && !leavingRef.current) router.back();
  }, [isEditing, existing, router]);

  // اضافه کردن برچسب به لیست
  const commitTag = (raw: string) => {
    setTags((current) => normalizeTags([...current, raw]));
    setTagInput('');
  };

  // ویرگول (انگلیسی یا فارسی) هم مثل اینتر برچسب رو ثبت می‌کنه
  const handleTagChange = (text: string) => {
    if (/[,،]/.test(text)) commitTag(text.replace(/[,،]/g, ''));
    else setTagInput(text);
  };
  // عوض شدن موعد؛ اگه موعد پاک شد، یادآوری هم خاموش میشه
  const handleDueChange = (next: string | null) => {
    setDueAt(next);
    if (!next) setOffset('OFF');
  };

  // انتخاب زمان یادآوری؛ اول اجازه‌ی اعلان می‌گیریم
  const handleOffsetChange = async (next: ReminderOffset) => {
    if (next !== 'OFF' && !(await ensureReminderPermission())) return;
    setOffset(next);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError(t('editor.titleRequired'));
      return;
    }
    const finalTags = normalizeTags(tagInput ? [...tags, tagInput] : tags);
    const done = type === 'TASK' && isDone; // یادداشت «انجام‌شده» نداره

    const store = useItemsStore.getState();
        // موعد و یادآوری فقط برای وظیفه‌ها معنی داره
    const due = type === 'TASK' ? dueAt : null;
    const remindAt = computeRemindAt(due, offset);
    if (isEditing && id) store.updateLocal(id, { title, content, isDone: done, tags: finalTags, dueAt: due, remindAt });
    else store.createLocal({ type, title, content, isDone: done, tags: finalTags, dueAt: due, remindAt });

    leavingRef.current = true;
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(t('list.deleteTitle'), t('list.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          leavingRef.current = true;
          useItemsStore.getState().removeLocal(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: isEditing ? t('editor.editTitle') : t('editor.newTitle') }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* نوع آیتم فقط موقع ساخت قابل انتخابه */}
          <SegmentedControl<ItemType>
            value={type}
            onChange={setType}
            disabled={isEditing}
            options={[
              { value: 'TASK', label: t('editor.typeTask') },
              { value: 'NOTE', label: t('editor.typeNote') },
            ]}
          />

          <TextField
            label={t('editor.titleLabel')}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (error) setError(null);
            }}
            placeholder={t('editor.titlePlaceholder')}
            error={error ?? undefined}
            maxLength={200}
            autoFocus={!isEditing}
          />

          <TextField
            label={t('editor.contentLabel')}
            value={content}
            onChangeText={setContent}
            placeholder={t('editor.contentPlaceholder')}
            multiline
            maxLength={20000}
          />

          <View style={styles.tagsBlock}>
            <TextField
              label={t('editor.tagsLabel')}
              value={tagInput}
              onChangeText={handleTagChange}
              onSubmitEditing={() => commitTag(tagInput)}
              placeholder={t('editor.tagsPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              blurOnSubmit={false}
              maxLength={40}
            />
            {tags.length > 0 ? (
              <View style={styles.tagList}>
                {tags.map((tag) => (
                  <TagChip
                    key={tag}
                    label={tag}
                    removeLabel={t('editor.removeTag', { tag })}
                    onRemove={() => setTags((current) => current.filter((value) => value !== tag))}
                  />
                ))}
              </View>
            ) : null}
          </View>
          {type === 'TASK' ? (
            <View style={styles.tagsBlock}>
              <DateTimeField
                label={t('editor.dueLabel')}
                placeholder={t('editor.dueNone')}
                clearLabel={t('editor.clearDue')}
                value={dueAt}
                onChange={handleDueChange}
              />
              {dueAt ? (
                <>
                  <Text style={[typography.caption, { color: palette.textMuted }]}>{t('editor.reminderLabel')}</Text>
                  <SegmentedControl<ReminderOffset>
                    value={offset}
                    onChange={handleOffsetChange}
                    options={[
                      { value: 'OFF', label: t('editor.reminderOff') },
                      { value: 'AT_TIME', label: t('editor.reminderAtTime') },
                      { value: 'HOUR', label: t('editor.reminderHour') },
                      { value: 'DAY', label: t('editor.reminderDay') },
                    ]}
                  />
                </>
              ) : null}
            </View>
          ) : null}

          {type === 'TASK' ? (
            <View style={styles.switchRow}>
              <Text style={[typography.body, { color: palette.text }]}>{t('editor.doneLabel')}</Text>
              <Switch
                value={isDone}
                onValueChange={setIsDone}
                accessibilityLabel={t('editor.doneLabel')}
                trackColor={{ true: palette.accent, false: palette.border }}
              />
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button label={t('common.save')} onPress={handleSave} />
            {isEditing ? <Button label={t('editor.deleteItem')} variant="danger" onPress={handleDelete} /> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  tagsBlock: { gap: spacing.sm },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { gap: spacing.md, marginTop: spacing.sm },
});
