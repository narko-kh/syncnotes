/**
 * تایپ‌های اصلی برنامه
 * این‌ها شکل داده‌ها رو تعریف می‌کنن و به هیچ کتابخونه‌ای وابسته نیستن.
 */

export type ItemType = 'TASK' | 'NOTE';

// یک وظیفه یا یادداشت (همونطور که سرور برمی‌گردونه)
export interface Item {
  id: string;
  type: ItemType;
  title: string;
  content: string;
  isDone: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  dueAt: string | null;
  remindAt: string | null;
}

// چیزی که کاربر موقع ساخت وارد می‌کنه
export interface ItemDraft {
  type: ItemType;
  title: string;
  content: string;
  isDone: boolean;
  tags: string[];
  dueAt: string | null;
  remindAt: string | null;
}

// چیزی که موقع ویرایش عوض میشه (نوع آیتم عوض نمیشه)
export type ItemPatch = Partial<
  Pick<Item, 'title' | 'content' | 'isDone' | 'tags' | 'dueAt' | 'remindAt'>
>;

// بدنه‌ی درخواست ساخت (id رو خود اپ می‌سازه تا آفلاین هم کار کنه)
export interface CreatePayload extends ItemDraft {
  id: string;
}

export type UpdatePayload = ItemPatch;

// صفحه‌ای از تغییرات سرور
export interface ItemsPage {
  data: Item[];
  nextCursor: string | null;
}

export interface SessionUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

export type AppLanguage = 'en' | 'fa';
export type ThemeMode = 'system' | 'light' | 'dark';
