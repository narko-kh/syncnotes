/**
 * ورودی ساخت وظیفه/یادداشت
 * id اختیاریه: اپ موبایل وقتی آفلاینه خودش یه UUID می‌سازه
 * و بعداً با همون id به سرور می‌فرسته تا تکراری ساخته نشه.
 */
import { ItemType } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

// فاصله‌های اول و آخر متن رو برمی‌داریم
const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateItemDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsEnum(ItemType)
  type!: ItemType;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  content?: string;

  @IsOptional()
  @IsBoolean()
  isDone?: boolean;

  // حداکثر ۱۰ تگ، هر تگ تا ۴۰ کاراکتر
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];
  // موعد انجام و زمان یادآوری (تاریخ ISO). مقدار null یعنی پاک کردن
  @IsOptional()
  @IsDateString()
  dueAt?: string | null;

  @IsOptional()
  @IsDateString()
  remindAt?: string | null;
}
