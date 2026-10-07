/**
 * تایپ‌های مشترک بخش احراز هویت
 */
import type { Request } from 'express';

// محتوای داخل توکن
export interface JwtPayload {
  sub: string; // شناسه‌ی کاربر
  typ: 'access' | 'refresh'; // نوع توکن، تا یکی جای دیگری استفاده نشه
}

// کاربری که از توکن تشخیص داده شده
export interface AuthenticatedUser {
  id: string;
}

// درخواستی که کاربرش مشخص شده
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// جفت توکن که بعد از ورود برمی‌گردونیم
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
