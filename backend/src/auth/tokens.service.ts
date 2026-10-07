/**
 * سرویس توکن‌ها
 * ساخت و بررسی توکن دسترسی (کوتاه‌مدت) و توکن رفرش (بلندمدت).
 * هر کدوم کلید امضای جدا دارن.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'crypto';
import type { JwtPayload, TokenPair } from './auth.types';

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ساخت هر دو توکن برای یک کاربر
  async issuePair(userId: string): Promise<TokenPair> {
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ sub: userId, typ: 'access' } satisfies JwtPayload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessTtl as JwtSignOptions['expiresIn'],
      }),
      this.jwt.signAsync({ sub: userId, typ: 'refresh' } satisfies JwtPayload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTtl as JwtSignOptions['expiresIn'],
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // بررسی توکن دسترسی (برای API و WebSocket)
  verifyAccess(token: string): Promise<JwtPayload> {
    return this.verify(token, 'JWT_ACCESS_SECRET', 'access');
  }

  // بررسی توکن رفرش
  verifyRefresh(token: string): Promise<JwtPayload> {
    return this.verify(token, 'JWT_REFRESH_SECRET', 'refresh');
  }

  /**
   * هش کردن توکن رفرش با SHA-256 برای ذخیره تو دیتابیس.
   * چرا bcrypt نه؟ چون bcrypt فقط ۷۲ بایت اول ورودی رو نگاه می‌کنه
   * و ابتدای همه‌ی JWT ها شبیه همه، پس امن نیست.
   */
  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // مقایسه‌ی امن دو هش (جلوگیری از timing attack)
  isSameHash(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  }

  // بررسی امضا، انقضا و نوع توکن
  private async verify(
    token: string,
    secretKey: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET',
    expectedType: JwtPayload['typ'],
  ): Promise<JwtPayload> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>(secretKey),
      });
      if (payload.typ !== expectedType) throw new Error('wrong token type');
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
