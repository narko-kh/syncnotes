/**
 * سرویس احراز هویت
 * ثبت‌نام، ورود، تمدید توکن و خروج.
 * رمز عبور هیچ‌وقت ذخیره نمیشه، فقط هش bcrypt اون.
 */
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from './tokens.service';
import type { TokenPair } from './auth.types';
import type { LoginDto, RegisterDto } from './dto/auth.dto';

// هرچی عدد بزرگ‌تر، هش کردن کندتر و امن‌تر
const BCRYPT_ROUNDS = 12;

export interface AuthResult extends TokenPair {
  user: { id: string; email: string };
}

@Injectable()
export class AuthService {
  // یه هش الکی برای وقتی که ایمیل وجود نداره (توضیحش پایین‌تر تو login هست)
  private readonly dummyHash = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
  ) {}

  // ثبت‌نام کاربر جدید
  async register(dto: RegisterDto): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email, passwordHash },
      });
      return this.startSession(user.id, user.email);
    } catch (error) {
      // کد P2002 یعنی این ایمیل قبلاً ثبت شده
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This email is already registered');
      }
      throw error;
    }
  }

  // ورود با ایمیل و رمز
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // حتی اگه کاربر پیدا نشه، یه مقایسه‌ی الکی انجام میدیم.
    // این‌طوری زمان پاسخ فرقی نمی‌کنه و کسی نمی‌تونه ایمیل‌های ثبت‌شده رو حدس بزنه.
    const isValid = await bcrypt.compare(dto.password, user?.passwordHash ?? this.dummyHash);

    if (!user || !isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.startSession(user.id, user.email);
  }

  // گرفتن توکن جدید با توکن رفرش (هر بار توکن رفرش هم عوض میشه)
  async refresh(refreshToken: string): Promise<AuthResult> {
    const payload = await this.tokens.verifyRefresh(refreshToken);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    const isCurrent =
      !!user?.refreshTokenHash &&
      this.tokens.isSameHash(this.tokens.hashToken(refreshToken), user.refreshTokenHash);

    if (!user || !isCurrent) {
      // توکن قدیمی دوباره استفاده شده؛ احتمالاً دزدیده شده.
      // برای احتیاط همه‌ی نشست‌های این کاربر رو می‌بندیم.
      if (user) await this.logout(user.id);
      throw new UnauthorizedException('Refresh token is no longer valid');
    }
    return this.startSession(user.id, user.email);
  }

  // خروج: هش توکن رفرش رو پاک می‌کنیم
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  // اطلاعات کاربر فعلی
  async me(userId: string): Promise<{ id: string; email: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  // ساخت توکن‌ها و ذخیره‌ی هش توکن رفرش
  private async startSession(userId: string, email: string): Promise<AuthResult> {
    const pair = await this.tokens.issuePair(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: this.tokens.hashToken(pair.refreshToken) },
    });
    return { user: { id: userId, email }, ...pair };
  }
}
