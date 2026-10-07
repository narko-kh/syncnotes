/**
 * محاسبه‌ی زمان یادآوری نسبت به موعد انجام
 * کاربر فقط «چقدر قبل از موعد» رو انتخاب می‌کنه؛ زمان دقیق اینجا حساب میشه.
 */

export type ReminderOffset = 'OFF' | 'AT_TIME' | 'HOUR' | 'DAY';

// فاصله‌ی یادآوری تا موعد (میلی‌ثانیه)
const OFFSET_MS = { AT_TIME: 0, HOUR: 60 * 60 * 1000, DAY: 24 * 60 * 60 * 1000 } as const;

// از موعد و گزینه‌ی انتخابی، زمان دقیق یادآوری رو می‌سازه (بدون موعد یا خاموش: null)
export function computeRemindAt(dueAt: string | null, offset: ReminderOffset): string | null {
  if (!dueAt || offset === 'OFF') return null;
  return new Date(Date.parse(dueAt) - OFFSET_MS[offset]).toISOString();
}

// برعکسش: از موعد و زمان یادآوریِ ذخیره‌شده، گزینه‌ی انتخابی رو پیدا می‌کنه (برای صفحه‌ی ویرایش)
export function detectOffset(
  dueAt: string | null | undefined,
  remindAt: string | null | undefined,
): ReminderOffset {
  if (!dueAt || !remindAt) return 'OFF';

  const diff = Date.parse(dueAt) - Date.parse(remindAt);
  const match = (['AT_TIME', 'HOUR', 'DAY'] as const).find((key) => Math.abs(OFFSET_MS[key] - diff) < 60_000);
  return match ?? 'AT_TIME';
}