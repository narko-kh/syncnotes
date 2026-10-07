/**
 * تنظیم CORS
 * هم برای API (HTTP) و هم برای WebSocket استفاده میشه.
 * اگه CORS_ORIGINS خالی باشه، مرورگرها اجازه‌ی دسترسی ندارن.
 * اپ موبایل اصلاً CORS نمی‌خواد، پس این فقط برای کلاینت‌های وب‌ـه.
 */
export function getCorsOrigins(): string[] | boolean {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return false;

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
