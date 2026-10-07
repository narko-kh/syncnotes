/**
 * اعتبارسنجی متغیرهای محیطی
 * اگه یکی از تنظیمات مهم نباشه یا ضعیف باشه، برنامه همون اول بالا نمیاد.
 * این‌طوری خطا رو زود می‌فهمیم، نه وسط کار.
 */

const REQUIRED_KEYS = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const SECRET_KEYS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const MIN_SECRET_LENGTH = 32;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  // همه‌ی کلیدهای ضروری باید مقدار داشته باشن
  for (const key of REQUIRED_KEYS) {
    if (!config[key]) {
      throw new Error(`متغیر محیطی ${key} تنظیم نشده است`);
    }
  }

  // کلیدهای امضای توکن باید به اندازه‌ی کافی طولانی باشن
  for (const key of SECRET_KEYS) {
    if (String(config[key]).length < MIN_SECRET_LENGTH) {
      throw new Error(`${key} باید حداقل ${MIN_SECRET_LENGTH} کاراکتر باشد`);
    }
  }

  // دو کلید نباید یکی باشن، وگرنه توکن رفرش میتونه جای توکن دسترسی بشینه
  if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET و JWT_REFRESH_SECRET باید متفاوت باشند');
  }

  return config;
}
