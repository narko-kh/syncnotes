# SyncNotes

اپ وظایف و یادداشت با همگام‌سازی لحظه‌ای بین دستگاه‌ها.

| بخش | تکنولوژی |
|---|---|
| `backend/` | NestJS · PostgreSQL · Prisma · Socket.IO · JWT |
| `mobile/`  | React Native (Expo) · TypeScript · Zustand · i18next |

## اجرا

```bash
# ۱. بک‌اند
cd backend
cp .env.example .env
docker compose up -d
npm install
npm run prisma:migrate
npm run start:dev

# ۲. اپ موبایل (ترمینال دوم)
cd mobile
cp .env.example .env     # EXPO_PUBLIC_API_URL رو تنظیم کن
npm install
npx expo start
```

جزئیات هر بخش تو README همون پوشه هست.
