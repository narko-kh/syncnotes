/**
 * ماژول Prisma
 * Global هست، پس تو هر ماژولی بدون import جداگانه قابل استفاده‌ست.
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
