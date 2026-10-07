/**
 * کلاینت HTTP
 * - توکن دسترسی رو خودکار تو هدر میذاره
 * - اگه توکن منقضی شده بود (۴۰۱)، یک‌بار تمدیدش می‌کنه و درخواست رو دوباره می‌فرسته
 * - تمدید همزمان فقط یک‌بار انجام میشه (single-flight)
 * - خطاها دو نوعن: «network» (اینترنت/سرور در دسترس نیست) و «http» (سرور جواب خطا داد)
 */
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/config/env';
import type { AuthResponse } from '@/domain/types';
import { getCachedSession, saveSession, type StoredSession } from '../storage/secureSession';

export class ApiError extends Error {
  constructor(
    public readonly kind: 'network' | 'http',
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  // برای ورود/ثبت‌نام false میشه چون هنوز توکنی نداریم
  auth?: boolean;
}

// وقتی نشست واقعاً تموم شده (تمدید هم رد شد)، اپ باید کاربر رو بیرون بندازه
let sessionExpiredHandler: (() => void) | null = null;
export function onSessionExpired(handler: () => void): void {
  sessionExpiredHandler = handler;
}

// ارسال واقعی درخواست (بدون منطق تمدید توکن)
async function rawFetch<T>(path: string, method: Method, body?: unknown, accessToken?: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    // قطع بودن اینترنت، تایم‌اوت یا در دسترس نبودن سرور
    throw new ApiError('network', 0, 'Network request failed');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const data = (await response.json()) as { message?: string | string[] };
      if (data.message) message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    } catch {
      // بدنه‌ی خطا JSON نبود؛ همون statusText کافیه
    }
    throw new ApiError('http', response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// تمدید توکن؛ اگه چند درخواست همزمان ۴۰۱ بگیرن، فقط یک تمدید انجام میشه
let refreshPromise: Promise<StoredSession> | null = null;

export function refreshSession(): Promise<StoredSession> {
  if (refreshPromise) return refreshPromise;

  const current = getCachedSession();
  if (!current) return Promise.reject(new ApiError('http', 401, 'No session'));

  refreshPromise = rawFetch<AuthResponse>('/auth/refresh', 'POST', {
    refreshToken: current.refreshToken,
  })
    .then(async (next) => {
      await saveSession(next);
      return next;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// تابع اصلی که بقیه‌ی اپ استفاده می‌کنن
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const session = auth ? getCachedSession() : null;

  try {
    return await rawFetch<T>(path, method, body, session?.accessToken);
  } catch (error) {
    const isExpired = error instanceof ApiError && error.kind === 'http' && error.status === 401;
    if (!isExpired || !auth || !session) throw error;

    // توکن منقضی شده: تمدید و یک بار دیگه تلاش
    try {
      const fresh = await refreshSession();
      return await rawFetch<T>(path, method, body, fresh.accessToken);
    } catch (refreshError) {
      const isRejected =
        refreshError instanceof ApiError && refreshError.kind === 'http' && refreshError.status === 401;
      // فقط وقتی سرور خودش تمدید رو رد کرد کاربر رو بیرون می‌اندازیم، نه وقتی اینترنت قطعه
      if (isRejected) sessionExpiredHandler?.();
      throw refreshError;
    }
  }
}
