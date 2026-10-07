# SyncNotes — Backend

بک‌اند اپ وظایف/یادداشت با همگام‌سازی لحظه‌ای بین دستگاه‌ها.
**NestJS · TypeScript · PostgreSQL · Prisma · Socket.IO**

## راه‌اندازی

```bash
cp .env.example .env          # بعد کلیدهای JWT رو عوض کن
docker compose up -d          # دیتابیس PostgreSQL
npm install
npm run prisma:migrate        # ساخت جدول‌ها
npm run start:dev             # سرور روی http://localhost:3000/api
```

## API

| متد | مسیر | توضیح |
|---|---|---|
| POST | `/api/auth/register` | ثبت‌نام |
| POST | `/api/auth/login` | ورود |
| POST | `/api/auth/refresh` | توکن جدید با توکن رفرش |
| POST | `/api/auth/logout` | خروج |
| GET | `/api/auth/me` | اطلاعات کاربر |
| POST | `/api/items` | ساخت وظیفه/یادداشت (`id` اختیاری برای حالت آفلاین) |
| GET | `/api/items` | لیست؛ فیلتر: `type` `isDone` `tag` `search` `limit` `cursor` |
| GET | `/api/items?updatedSince=ISO` | **حالت sync**: همه‌ی تغییرات بعد از آن زمان، شامل حذف‌شده‌ها |
| GET | `/api/items/:id` | یک آیتم |
| PATCH | `/api/items/:id` | ویرایش |
| DELETE | `/api/items/:id` | حذف نرم |

توکن دسترسی تو هدر: `Authorization: Bearer <accessToken>`

## همگام‌سازی لحظه‌ای (WebSocket)

```ts
const socket = io('http://localhost:3000/realtime', { auth: { token: accessToken } });
socket.on('item:created', (item) => { /* ... */ });
socket.on('item:updated', (item) => { /* ... */ });
socket.on('item:deleted', ({ id, deletedAt }) => { /* ... */ });
```

هر کاربر فقط رویدادهای خودش رو می‌گیره. بعد از قطع و وصل شدن اینترنت،
اپ با `updatedSince` تغییرات از دست‌رفته رو می‌گیره.

## امنیت

- رمز با bcrypt (۱۲ دور) هش میشه؛ توکن رفرش با SHA-256 و فقط هشش ذخیره میشه
- توکن دسترسی ۱۵ دقیقه‌ای + توکن رفرش با چرخش (rotation) و تشخیص استفاده‌ی مجدد
- محدودیت تعداد درخواست (سخت‌گیرتر روی ورود/ثبت‌نام)
- اعتبارسنجی همه‌ی ورودی‌ها، حذف فیلدهای اضافه، هدرهای helmet
- همه‌ی کوئری‌ها با `userId` فیلتر میشن (آیتم دیگران حتی ۴۰۴ میده، نه ۴۰۳)

## ساختار

```
src/
├── auth/       ثبت‌نام، ورود، توکن‌ها، گارد
├── items/      CRUD وظایف و یادداشت‌ها
├── realtime/   گیت‌وی WebSocket
├── prisma/     اتصال دیتابیس
├── config/     اعتبارسنجی متغیرهای محیطی
└── common/     ابزارهای مشترک
```
