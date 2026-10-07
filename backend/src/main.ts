/**
 * نقطه‌ی شروع برنامه
 * اینجا تنظیمات امنیتی و اعتبارسنجی کلی رو فعال می‌کنیم.
 */
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getCorsOrigins } from './common/cors';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // پشت پروکسی هاستینگ، IP واقعی کاربر رو از هدر پروکسی بخون (برای محدودیت تعداد درخواست)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // هدرهای امنیتی استاندارد
  app.use(helmet());

  // فقط دامنه‌های مجاز از مرورگر درخواست بزنن
  app.enableCors({ origin: getCorsOrigins() });

  // همه‌ی مسیرها با /api شروع میشن
  app.setGlobalPrefix('api');

  // اعتبارسنجی ورودی‌ها:
  // whitelist فیلدهای اضافه رو حذف می‌کنه، forbidNonWhitelisted بهشون خطا میده
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // بستن تمیز اتصال دیتابیس موقع خاموش شدن
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`سرور روی پورت ${port} بالا اومد`);
}

void bootstrap();
