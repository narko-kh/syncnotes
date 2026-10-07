/**
 * موتور همگام‌سازی
 * سه کار انجام میده:
 *  ۱. صف ارسال (outbox) رو به ترتیب به سرور می‌فرسته.
 *  ۲. تغییرات جدید سرور رو با updatedSince می‌گیره (برای وقتی که آفلاین بودیم).
 *  ۳. تغییرات لحظه‌ای رو از WebSocket می‌گیره و تو استور اعمال می‌کنه.
 * هر وقت اینترنت وصل بشه، اپ به پیش‌زمینه بیاد یا تغییری ثبت بشه، همگام‌سازی اجرا میشه.
 */
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import type { Item } from '@/domain/types';
import { useItemsStore, type OutboxOp } from '@/stores/itemsStore';
import { useSyncStore } from '@/stores/syncStore';
import { createItem, deleteItem, fetchChanges, updateItem } from '../api/itemsApi';
import { ApiError } from '../api/http';
import { connectSocket, disconnectSocket } from '../realtime/socketClient';

const EPOCH = '1970-01-01T00:00:00.000Z';
const RETRY_INTERVAL_MS = 30_000;

let started = false;
let running = false;
let rerunRequested = false;
let cleanups: Array<() => void> = [];

// ───────────── شروع و پایان ─────────────

export function startSync(): void {
  if (started) return;
  started = true;

  // ۱. وضعیت اینترنت: با وصل شدن، همه‌چیز دوباره همگام میشه
  cleanups.push(
    NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && state.isInternetReachable !== false;
      useSyncStore.getState().setOnline(online);
      if (online) {
        openSocket();
        void syncNow();
      }
    }),
  );

  // ۲. برگشتن اپ از پس‌زمینه
  const appStateSub = AppState.addEventListener('change', (status) => {
    if (status === 'active') {
      openSocket();
      void syncNow();
    }
  });
  cleanups.push(() => appStateSub.remove());

  // ۳. هر تغییر تازه تو صف ارسال، فوراً فرستاده میشه
  cleanups.push(
    useItemsStore.subscribe((state, prev) => {
      if (state.outbox !== prev.outbox && state.outbox.length > 0) void syncNow();
    }),
  );

  // ۴. تلاش دوباره‌ی دوره‌ای (اگه ارسالی جا مونده باشه)
  const timer = setInterval(() => {
    if (useItemsStore.getState().outbox.length > 0) void syncNow();
  }, RETRY_INTERVAL_MS);
  cleanups.push(() => clearInterval(timer));

  openSocket();
  void syncNow();
}

export function stopSync(): void {
  cleanups.forEach((cleanup) => cleanup());
  cleanups = [];
  disconnectSocket();
  started = false;
  useSyncStore.getState().setSocketConnected(false);
}

// ───────────── اجرای همگام‌سازی ─────────────

// ارسال صف + گرفتن تغییرات جدید. اگه همزمان دوباره صدا زده بشه، یک دور دیگه اجرا میشه.
export async function syncNow(): Promise<void> {
  if (!started || !useSyncStore.getState().isOnline) return;
  if (running) {
    rerunRequested = true;
    return;
  }

  running = true;
  useSyncStore.getState().setSyncing(true);
  try {
    do {
      rerunRequested = false;
      await flushOutbox();
      await pullChanges();
    } while (rerunRequested);
  } catch {
    // خطای شبکه یا سرور: تغییرات تو صف می‌مونن و بعداً دوباره تلاش میشه
  } finally {
    running = false;
    useSyncStore.getState().setSyncing(false);
  }
}

// ───────────── ارسال صف ─────────────

async function flushOutbox(): Promise<void> {
  for (;;) {
    const store = useItemsStore.getState();
    const op = store.outbox[0];
    if (!op) return;

    store.markInFlight(op.opId);
    try {
      const serverItem = await sendOp(op);
      useItemsStore.getState().completeOp(op.opId, op.rev, serverItem);
    } catch (error) {
      if (isPermanentFailure(error)) {
        handlePermanentFailure(op, error as ApiError);
        continue; // بعدی
      }
      throw error; // شبکه/سرور/۴۰۱: همین‌جا متوقف میشیم و بعداً ادامه میدیم
    } finally {
      useItemsStore.getState().markInFlight(null);
    }
  }
}

// یک عملیات رو به سرور می‌فرسته و نسخه‌ی سرور آیتم رو برمی‌گردونه
async function sendOp(op: OutboxOp): Promise<Item | null> {
  switch (op.kind) {
    case 'create':
      try {
        return await createItem(op.payload);
      } catch (error) {
        // ۴۰۹ یعنی قبلاً ساخته شده (مثلاً جواب قبلی گم شده بود)؛ فقط ویرایشش می‌کنیم
        if (error instanceof ApiError && error.status === 409) {
          const { title, content, isDone, tags, dueAt, remindAt } = op.payload;
          return updateItem(op.itemId, { title, content, isDone, tags, dueAt, remindAt });
        }
        throw error;
      }
    case 'update':
      return updateItem(op.itemId, op.payload);
    case 'delete':
      try {
        await deleteItem(op.itemId);
      } catch (error) {
        // ۴۰۴ یعنی از قبل حذف شده؛ مشکلی نیست
        if (!(error instanceof ApiError && error.status === 404)) throw error;
      }
      return null;
  }
}

// خطاهای ۴xx (به‌جز ۴۰۱، ۴۰۸ و ۴۲۹) یعنی با تکرار درست نمیشن
function isPermanentFailure(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.kind !== 'http') return false;
  return error.status >= 400 && error.status < 500 && ![401, 408, 429].includes(error.status);
}

// عملیاتی که هیچ‌وقت موفق نمیشه نباید صف رو برای همیشه قفل کنه
function handlePermanentFailure(op: OutboxOp, error: ApiError): void {
  const store = useItemsStore.getState();
  if (op.kind === 'update' && error.status === 404) {
    store.applyServerDelete(op.itemId); // آیتم تو سرور حذف شده
  } else if (op.kind === 'create') {
    store.dropOp(op.opId);
    store.applyServerDelete(op.itemId); // ساخت رد شد؛ نسخه‌ی محلی هم بی‌معنیه
  } else {
    store.dropOp(op.opId);
  }
}

// ───────────── گرفتن تغییرات سرور ─────────────

async function pullChanges(): Promise<void> {
  const store = useItemsStore.getState();
  const since = store.lastSyncAt ?? EPOCH;
  let newest = since;
  let cursor: string | undefined;

  do {
    const page = await fetchChanges(since, cursor);
    for (const item of page.data) {
      useItemsStore.getState().applyServerItem(item);
      if (item.updatedAt > newest) newest = item.updatedAt;
    }
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  if (newest !== since) {
    // یک میلی‌ثانیه عقب‌تر ذخیره می‌کنیم تا تغییری که همون لحظه ثبت شده از دست نره
    useItemsStore.getState().setLastSyncAt(new Date(Date.parse(newest) - 1).toISOString());
  }
}

// ───────────── WebSocket ─────────────

function openSocket(): void {
  connectSocket({
    onConnect: () => {
      useSyncStore.getState().setSocketConnected(true);
      void syncNow(); // احتمالاً وقتی وصل نبودیم تغییری اتفاق افتاده
    },
    onDisconnect: () => useSyncStore.getState().setSocketConnected(false),
    onItemUpsert: (item) => useItemsStore.getState().applyServerItem(item),
    onItemDeleted: ({ id }) => useItemsStore.getState().applyServerDelete(id),
  });
}
