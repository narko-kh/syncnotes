/**
 * قالب‌بندی تاریخ برای نمایش
 * بر اساس زبان اپ (فارسی یا انگلیسی) تاریخ کوتاه می‌سازه.
 */
import type { AppLanguage } from '@/domain/types';

export function formatShortDate(iso: string, language: AppLanguage): string {
  try {
    return new Date(iso).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    // اگه دستگاه این زبان رو پشتیبانی نکرد، تاریخ ساده نشون میدیم
    return iso.slice(0, 10);
  }
}

// تاریخ و ساعت کامل برای نمایش موعد (مثلاً «Oct 8, 10:00 AM» یا «۱۶ مهر، ۱۰:۰۰»)
export function formatDueDateTime(iso: string, language: AppLanguage): string {
  try {
    return new Date(iso).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 16).replace('T', ' ');
  }
}

// وضعیت موعد: گذشته، امروز یا آینده
export type DueStatus = 'overdue' | 'today' | 'upcoming';

export function getDueStatus(iso: string, now: Date = new Date()): DueStatus {
  const due = new Date(iso);
  if (due.getTime() < now.getTime()) return 'overdue';
  return due.toDateString() === now.toDateString() ? 'today' : 'upcoming';
}