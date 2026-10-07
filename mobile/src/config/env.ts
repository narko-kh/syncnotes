/**
 * تنظیمات محیطی اپ
 * آدرس سرور از متغیر EXPO_PUBLIC_API_URL میاد (فایل .env).
 * API روی /api هست ولی WebSocket روی ریشه‌ی سرور (/realtime).
 */
const rawUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// اسلش آخر آدرس رو برمی‌داریم تا آدرس‌ها دوتا اسلش نشن
export const API_ORIGIN = rawUrl.replace(/\/+$/, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const REALTIME_URL = `${API_ORIGIN}/realtime`;

// بیشترین زمان انتظار برای جواب سرور (میلی‌ثانیه)
export const REQUEST_TIMEOUT_MS = 15_000;
