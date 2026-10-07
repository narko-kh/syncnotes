/**
 * پارامترهای جستجو و صفحه‌بندی لیست آیتم‌ها
 * اگه updatedSince بدی، حالت «همگام‌سازی» فعال میشه:
 * همه‌ی تغییرات بعد از اون زمان (حتی حذف‌شده‌ها) برمی‌گرده.
 */
import { ItemType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// رشته‌ی 'true' / 'false' تو آدرس رو به بولین واقعی تبدیل می‌کنیم
const toBoolean = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

export class QueryItemsDto {
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isDone?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsDateString()
  updatedSince?: string;

  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
