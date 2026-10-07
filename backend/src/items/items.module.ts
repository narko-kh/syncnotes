/**
 * ماژول آیتم‌ها
 * برای گارد ورود از AuthModule و برای ارسال رویداد لحظه‌ای از RealtimeModule استفاده می‌کنه.
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
