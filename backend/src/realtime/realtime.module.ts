/**
 * ماژول همگام‌سازی لحظه‌ای
 * برای شناختن کاربر از AuthModule استفاده می‌کنه.
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [AuthModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
