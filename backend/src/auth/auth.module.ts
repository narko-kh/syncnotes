/**
 * ماژول احراز هویت
 * TokensService و JwtAuthGuard رو export می‌کنه تا ماژول‌های دیگه
 * (آیتم‌ها و WebSocket) هم بتونن کاربر رو بشناسن.
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokensService } from './tokens.service';

@Module({
  // کلید هر توکن موقع ساخت/بررسی داده میشه، پس اینجا تنظیم خاصی نیست
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TokensService, JwtAuthGuard],
  exports: [TokensService, JwtAuthGuard],
})
export class AuthModule {}
