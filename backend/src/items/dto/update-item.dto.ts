/**
 * ورودی ویرایش
 * همه‌ی فیلدها اختیاری‌ان. شناسه و نوع آیتم بعد از ساخت عوض نمیشن.
 */
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateItemDto } from './create-item.dto';

export class UpdateItemDto extends PartialType(OmitType(CreateItemDto, ['id', 'type'] as const)) {}
