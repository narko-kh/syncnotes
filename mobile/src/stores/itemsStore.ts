/**
 * استور آیتم‌ها (قلب حالت آفلاین)
 *
 * روش کار («اول محلی»):
 *  ۱. هر تغییر کاربر فوراً روی نسخه‌ی محلی اعمال میشه (UI سریع و بدون انتظار).
 *  ۲. همون تغییر تو «صف ارسال» (outbox) میره تا موقع آنلاین بودن به سرور بره.
 *  ۳. تغییرات بقیه‌ی دستگاه‌ها از سرور میاد و با نسخه‌ی محلی ادغام میشه.
 *
 * قانون ادغام: اگه برای یک آیتم تغییر ارسال‌نشده داریم، نسخه‌ی محلی برنده‌ست.
 * برای هر آیتم حداکثر یک عملیات «ساخت/ویرایش» تو صف نگه می‌داریم (ادغام تغییرات).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CreatePayload, Item, ItemDraft, ItemPatch, UpdatePayload } from '@/domain/types';
import { normalizeTags } from '@/utils/validation';

interface OpBase {
  opId: string;
  itemId: string;
  // شماره‌ی نسخه‌ی عملیات؛ اگه وسط ارسال ویرایش بشه بالا میره
  rev: number;
}

export type OutboxOp =
  | (OpBase & { kind: 'create'; payload: CreatePayload })
  | (OpBase & { kind: 'update'; payload: UpdatePayload })
  | (OpBase & { kind: 'delete' });

interface ItemsState {
  // اینکه این داده‌ها مال کدوم کاربره (برای جلوگیری از قاطی شدن حساب‌ها)
  ownerId: string | null;
  items: Record<string, Item>;
  outbox: OutboxOp[];
  // آخرین زمانی که از سرور تغییرات گرفتیم
  lastSyncAt: string | null;
  // عملیاتی که الان در حال ارسال به سرور هست (ذخیره نمیشه)
  inFlightOpId: string | null;

  // ── عملیات رابط کاربری (اول محلی) ──
  createLocal: (draft: ItemDraft) => string;
  updateLocal: (id: string, patch: ItemPatch) => void;
  removeLocal: (id: string) => void;

  // ── عملیات موتور همگام‌سازی ──
  markInFlight: (opId: string | null) => void;
  completeOp: (opId: string, sentRev: number, serverItem: Item | null) => void;
  dropOp: (opId: string) => void;
  applyServerItem: (item: Item) => void;
  applyServerDelete: (id: string) => void;
  setLastSyncAt: (iso: string) => void;
  reset: (ownerId: string | null) => void;
}

const initialData = { ownerId: null, items: {}, outbox: [], lastSyncAt: null, inFlightOpId: null };

// یک کلید رو از آبجکت حذف می‌کنه (بدون تغییر آبجکت اصلی)
function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const { [key]: _removed, ...rest } = record;
  return rest;
}

export const useItemsStore = create<ItemsState>()(
  persist(
    (set) => ({
      ...initialData,

      // ساخت آیتم جدید؛ id رو همین‌جا می‌سازیم تا آفلاین هم یکتا باشه
      createLocal: (draft) => {
        const id = Crypto.randomUUID();
        const now = new Date().toISOString();
        const clean: ItemDraft = {
          ...draft,
          title: draft.title.trim(),
          tags: normalizeTags(draft.tags),
        };

        const item: Item = { id, ...clean, createdAt: now, updatedAt: now, deletedAt: null };
        const op: OutboxOp = {
          opId: Crypto.randomUUID(),
          kind: 'create',
          itemId: id,
          rev: 0,
          payload: { id, ...clean },
        };

        set((s) => ({ items: { ...s.items, [id]: item }, outbox: [...s.outbox, op] }));
        return id;
      },

      // ویرایش آیتم؛ اگه از قبل عملیات ارسال‌نشده داره، تغییر رو توش ادغام می‌کنیم
      updateLocal: (id, patch) =>
        set((s) => {
          const existing = s.items[id];
          if (!existing) return s;

          const cleanPatch: ItemPatch = {
            ...patch,
            ...(patch.title !== undefined && { title: patch.title.trim() }),
            ...(patch.tags !== undefined && { tags: normalizeTags(patch.tags) }),
          };
          const item: Item = { ...existing, ...cleanPatch, updatedAt: new Date().toISOString() };

          const index = s.outbox.findIndex((o) => o.itemId === id && o.kind !== 'delete');
          let outbox: OutboxOp[];

          if (index === -1) {
            // هنوز چیزی تو صف نیست: یک عملیات ویرایش جدید
            outbox = [
              ...s.outbox,
              { opId: Crypto.randomUUID(), kind: 'update', itemId: id, rev: 0, payload: cleanPatch },
            ];
          } else {
            outbox = s.outbox.map((op, i) => {
              if (i !== index) return op;
              if (op.kind === 'create') return { ...op, rev: op.rev + 1, payload: { ...op.payload, ...cleanPatch } };
              if (op.kind === 'update') return { ...op, rev: op.rev + 1, payload: { ...op.payload, ...cleanPatch } };
              return op;
            });
          }

          return { items: { ...s.items, [id]: item }, outbox };
        }),

      // حذف آیتم
      removeLocal: (id) =>
        set((s) => {
          const mine = s.outbox.filter((o) => o.itemId === id);
          const hasCreate = mine.some((o) => o.kind === 'create');
          const createInFlight = mine.some((o) => o.kind === 'create' && o.opId === s.inFlightOpId);

          // عملیات‌های این آیتم رو پاک می‌کنیم، به‌جز اونی که همین الان داره ارسال میشه
          const outbox = s.outbox.filter((o) => o.itemId !== id || o.opId === s.inFlightOpId);

          // اگه آیتم هیچ‌وقت به سرور نرسیده، لازم نیست چیزی برای حذف بفرستیم
          if (!hasCreate || createInFlight) {
            outbox.push({ opId: Crypto.randomUUID(), kind: 'delete', itemId: id, rev: 0 });
          }
          return { items: withoutKey(s.items, id), outbox };
        }),

      markInFlight: (inFlightOpId) => set({ inFlightOpId }),

      // ارسال یک عملیات موفق بود
      completeOp: (opId, sentRev, serverItem) =>
        set((s) => {
          const op = s.outbox.find((o) => o.opId === opId);
          if (!op) return s; // وسط کار حذف شده

          // اگه وسط ارسال دوباره ویرایش شده، عملیات رو نگه می‌داریم تا نسخه‌ی جدید هم بره
          const editedMeanwhile = op.rev !== sentRev && op.kind !== 'delete';
          let outbox: OutboxOp[];

          if (!editedMeanwhile) {
            outbox = s.outbox.filter((o) => o.opId !== opId);
          } else if (op.kind === 'create') {
            // ساخت انجام شد، پس باقی‌مونده فقط یک ویرایشه
            const { title, content, isDone, tags, dueAt, remindAt } = op.payload;
            outbox = s.outbox.map((o) =>
              o.opId === opId
                ? { opId: o.opId, itemId: o.itemId, rev: o.rev, kind: 'update', payload: { title, content, isDone, tags, dueAt, remindAt } }
                : o,
            );
          } else {
            outbox = s.outbox;
          }

          // نسخه‌ی سرور رو فقط وقتی می‌پذیریم که برای این آیتم چیزی تو صف نمونده
          const stillPending = outbox.some((o) => o.itemId === op.itemId);
          const items =
            serverItem && !serverItem.deletedAt && !stillPending
              ? { ...s.items, [serverItem.id]: serverItem }
              : s.items;

          return { outbox, items };
        }),

      // عملیات رد‌شده‌ی دائمی رو از صف درمیاره
      dropOp: (opId) => set((s) => ({ outbox: s.outbox.filter((o) => o.opId !== opId) })),

      // آیتمی که از سرور اومده (از لیست تغییرات یا WebSocket)
      applyServerItem: (item) =>
        set((s) => {
          // تغییر ارسال‌نشده‌ی محلی داریم؛ نسخه‌ی محلی برنده‌ست
          if (s.outbox.some((o) => o.itemId === item.id)) return s;

          if (item.deletedAt) {
            return s.items[item.id] ? { items: withoutKey(s.items, item.id) } : s;
          }
          return { items: { ...s.items, [item.id]: item } };
        }),

      // سرور اعلام کرده آیتم حذف شده
      applyServerDelete: (id) =>
        set((s) => ({
          items: withoutKey(s.items, id),
          outbox: s.outbox.filter((o) => o.itemId !== id || o.opId === s.inFlightOpId),
        })),

      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),

      // پاک کردن همه‌چیز (خروج از حساب یا عوض شدن کاربر)
      reset: (ownerId) => set({ ...initialData, ownerId }),
    }),
    {
      name: 'syncnotes.items',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
      // inFlightOpId ذخیره نمیشه چون بعد از بستن اپ بی‌معنیه
      partialize: (state) => ({
        ownerId: state.ownerId,
        items: state.items,
        outbox: state.outbox,
        lastSyncAt: state.lastSyncAt,
      }),
    },
  ),
);
