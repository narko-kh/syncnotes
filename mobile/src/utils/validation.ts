/**
 * اعتبارسنجی ورودی‌ها در سمت اپ
 * قوانین دقیقاً مثل سرورن تا کاربر قبل از ارسال، خطا رو ببینه.
 */

// ایمیل ساده ولی کافی؛ بررسی نهایی با سرور
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.length <= 254;
}

// رمز: ۸ تا ۷۲ کاراکتر، حداقل یک حرف و یک عدد
export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && value.length <= 72 && /[A-Za-z]/.test(value) && /\d/.test(value);
}

// برچسب‌ها: کوچیک، بدون فاصله‌ی اضافه، بدون تکرار، حداکثر ۱۰ تا
export function normalizeTags(tags: string[]): string[] {
  const cleaned = tags.map((tag) => tag.trim().toLowerCase().slice(0, 40)).filter(Boolean);
  return [...new Set(cleaned)].slice(0, 10);
}
