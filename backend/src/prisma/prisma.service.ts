/**
 * سرویس Prisma
 * یک اتصال مشترک به دیتابیس که تو کل برنامه استفاده میشه.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // وقتی برنامه بالا میاد به دیتابیس وصل میشیم
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  // وقتی برنامه بسته میشه اتصال رو درست می‌بندیم
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
