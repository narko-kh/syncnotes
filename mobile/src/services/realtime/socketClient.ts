/**
 * کلاینت WebSocket (Socket.IO)
 * اتصال لحظه‌ای به سرور برای گرفتن تغییرات بقیه‌ی دستگاه‌ها.
 * توکن هر بار موقع اتصال از حافظه خونده میشه، پس بعد از تمدید توکن هم درست وصل میشه.
 */
import { io, type Socket } from 'socket.io-client';
import { REALTIME_URL } from '@/config/env';
import type { Item } from '@/domain/types';
import { refreshSession } from '../api/http';
import { getCachedSession } from '../storage/secureSession';

export interface SocketHandlers {
  onConnect: () => void;
  onDisconnect: () => void;
  onItemUpsert: (item: Item) => void;
  onItemDeleted: (payload: { id: string }) => void;
}

let socket: Socket | null = null;

// اتصال رو برقرار می‌کنه (اگه از قبل وصله، کاری نمی‌کنه)
export function connectSocket(handlers: SocketHandlers): void {
  if (socket) {
    if (!socket.connected) socket.connect();
    return;
  }

  socket = io(REALTIME_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    // هر بار که وصل میشیم، آخرین توکن رو می‌فرستیم
    auth: (callback) => callback({ token: getCachedSession()?.accessToken ?? '' }),
  });

  socket.on('connect', handlers.onConnect);

  socket.on('disconnect', (reason) => {
    handlers.onDisconnect();
    // سرور اتصال رو بست (احتمالاً توکن منقضی شده): تمدید می‌کنیم و دوباره وصل میشیم
    if (reason === 'io server disconnect') void renewTokenAndReconnect();
  });

  socket.on('item:created', handlers.onItemUpsert);
  socket.on('item:updated', handlers.onItemUpsert);
  socket.on('item:deleted', handlers.onItemDeleted);
}

// اتصال رو کامل می‌بنده (موقع خروج از حساب)
export function disconnectSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

async function renewTokenAndReconnect(): Promise<void> {
  try {
    await refreshSession();
    socket?.connect();
  } catch {
    // تمدید نشد (آفلاین یا نشست تموم شده)؛ بعداً با تغییر وضعیت شبکه دوباره تلاش میشه
  }
}
