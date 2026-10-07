/**
 * سرویس آیتم‌ها (وظیفه و یادداشت)
 * قانون مهم: هر کوئری حتماً با userId فیلتر میشه،
 * پس هیچ کاربری به داده‌ی کاربر دیگه دسترسی نداره.
 * بعد از هر تغییر، رویداد لحظه‌ای برای بقیه‌ی دستگاه‌های کاربر فرستاده میشه.
 */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { REALTIME_EVENTS } from '../realtime/realtime.events';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { CreateItemDto } from './dto/create-item.dto';
import type { QueryItemsDto } from './dto/query-items.dto';
import type { UpdateItemDto } from './dto/update-item.dto';

const DEFAULT_PAGE_SIZE = 50;

// آیتم همراه با تگ‌هاش، همونطور که از دیتابیس میاد
type ItemWithTags = Prisma.ItemGetPayload<{ include: { tags: true } }>;

// شکلی که به کلاینت برمی‌گردونیم (تگ‌ها فقط اسم)
export interface ItemResponse {
  id: string;
  type: ItemWithTags['type'];
  title: string;
  content: string;
  isDone: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  dueAt: Date | null;
  remindAt: Date | null;
}

export interface ItemsPage {
  data: ItemResponse[];
  nextCursor: string | null;
}

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // ساخت آیتم جدید
  async create(userId: string, dto: CreateItemDto): Promise<ItemResponse> {
    try {
      const item = await this.prisma.item.create({
        data: {
          id: dto.id,
          userId,
          type: dto.type,
          title: dto.title,
          content: dto.content ?? '',
          isDone: dto.isDone ?? false,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          remindAt: dto.remindAt ? new Date(dto.remindAt) : null,
          tags: { connectOrCreate: this.tagsInput(userId, dto.tags) },
        },
        include: { tags: true },
      });

      const response = this.toResponse(item);
      this.realtime.emitToUser(userId, REALTIME_EVENTS.ITEM_CREATED, response);
      return response;
    } catch (error) {
      // اگه id تکراری باشه (مثلاً درخواست آفلاین دوبار رفته)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An item with this id already exists');
      }
      throw error;
    }
  }

  // لیست آیتم‌ها با فیلتر، جستجو و صفحه‌بندی
  async findAll(userId: string, query: QueryItemsDto): Promise<ItemsPage> {
    const take = query.limit ?? DEFAULT_PAGE_SIZE;
    const isSyncMode = query.updatedSince !== undefined;

    const where: Prisma.ItemWhereInput = {
      userId,
      // حالت عادی: حذف‌شده‌ها رو نشون نمیدیم. حالت sync: همه‌ی تغییرات
      ...(isSyncMode
        ? { updatedAt: { gt: new Date(query.updatedSince as string) } }
        : { deletedAt: null }),
      ...(query.type && { type: query.type }),
      ...(query.isDone !== undefined && { isDone: query.isDone }),
      ...(query.tag && { tags: { some: { name: query.tag.trim().toLowerCase() } } }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { content: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    // یکی بیشتر می‌گیریم تا بفهمیم صفحه‌ی بعدی هست یا نه
    const rows = await this.prisma.item.findMany({
      where,
      include: { tags: true },
      orderBy: isSyncMode
        ? [{ updatedAt: 'asc' }, { id: 'asc' }]
        : [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
    });

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;

    return {
      data: page.map((row) => this.toResponse(row)),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }

  // گرفتن یک آیتم
  async findOne(userId: string, id: string): Promise<ItemResponse> {
    return this.toResponse(await this.getOwnedOrFail(userId, id));
  }

  // ویرایش آیتم (آخرین تغییر برنده‌ست)
  async update(userId: string, id: string, dto: UpdateItemDto): Promise<ItemResponse> {
    await this.getOwnedOrFail(userId, id);

    const item = await this.prisma.item.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.isDone !== undefined && { isDone: dto.isDone }),
        ...(dto.dueAt !== undefined && { dueAt: dto.dueAt ? new Date(dto.dueAt) : null }),
        ...(dto.remindAt !== undefined && { remindAt: dto.remindAt ? new Date(dto.remindAt) : null }),
        // اگه تگ‌ها اومده باشن، لیست قبلی رو با لیست جدید جایگزین می‌کنیم
        ...(dto.tags !== undefined && {
          tags: { set: [], connectOrCreate: this.tagsInput(userId, dto.tags) },
        }),
      },
      include: { tags: true },
    });

    const response = this.toResponse(item);
    this.realtime.emitToUser(userId, REALTIME_EVENTS.ITEM_UPDATED, response);
    return response;
  }

  // حذف نرم: فقط deletedAt پر میشه تا بقیه‌ی دستگاه‌ها هم متوجه بشن
  async remove(userId: string, id: string): Promise<void> {
    await this.getOwnedOrFail(userId, id);

    const item = await this.prisma.item.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });

    this.realtime.emitToUser(userId, REALTIME_EVENTS.ITEM_DELETED, item);
  }

  // آیتم باید مال همین کاربر و حذف‌نشده باشه، وگرنه ۴۰۴.
  // عمداً برای «مال کس دیگه» هم ۴۰۴ میدیم تا وجود آیتم لو نره.
  private async getOwnedOrFail(userId: string, id: string): Promise<ItemWithTags> {
    const item = await this.prisma.item.findFirst({
      where: { id, userId, deletedAt: null },
      include: { tags: true },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  // اسم تگ‌ها رو تمیز می‌کنیم (کوچیک، بدون فاصله‌ی اضافه، بدون تکرار)
  // و برای هر کدوم «اگه نبود بساز» رو آماده می‌کنیم
  private tagsInput(userId: string, tags: string[] = []): Prisma.TagCreateOrConnectWithoutItemsInput[] {
    const names = [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
    return names.map((name) => ({
      where: { userId_name: { userId, name } },
      create: { userId, name },
    }));
  }

  // تبدیل رکورد دیتابیس به خروجی API
  private toResponse(item: ItemWithTags): ItemResponse {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      content: item.content,
      isDone: item.isDone,
      tags: item.tags.map((tag) => tag.name),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: item.deletedAt,
      dueAt: item.dueAt,
      remindAt: item.remindAt,
    };
  }
}
