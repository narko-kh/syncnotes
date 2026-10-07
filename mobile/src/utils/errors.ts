/**
 * تبدیل خطاهای سرور به پیام قابل‌فهم برای کاربر
 * پیام‌ها از فایل ترجمه میان، پس به زبان کاربر نمایش داده میشن.
 */
import type { TFunction } from 'i18next';
import { ApiError } from '@/services/api/http';

export type ErrorContext = 'login' | 'register' | 'general';

export function describeError(error: unknown, t: TFunction, context: ErrorContext = 'general'): string {
  if (!(error instanceof ApiError)) return t('errors.unknown');

  if (error.kind === 'network') return t('errors.network');
  if (error.status === 401 && context === 'login') return t('errors.invalidCredentials');
  if (error.status === 409 && context === 'register') return t('errors.emailTaken');
  if (error.status === 429) return t('errors.tooManyRequests');
  if (error.status === 400) return t('errors.validation');
  return t('errors.unknown');
}
