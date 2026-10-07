/**
 * ورودی‌های بخش احراز هویت
 * همه‌ی ورودی‌ها قبل از رسیدن به سرویس اعتبارسنجی میشن.
 */
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// ایمیل رو تمیز و کوچیک می‌کنیم تا یک ایمیل دوبار ثبت نشه
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  // حداکثر ۷۲ چون bcrypt بیشتر از این رو نمی‌خونه
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;
}

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(20)
  @MaxLength(2048)
  refreshToken!: string;
}
