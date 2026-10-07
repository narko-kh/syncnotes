/**
 * وضعیت لحظه‌ای همگام‌سازی (ذخیره نمیشه، فقط برای نمایش)
 */
import { create } from 'zustand';

interface SyncState {
  isOnline: boolean;
  isSocketConnected: boolean;
  isSyncing: boolean;
  setOnline: (value: boolean) => void;
  setSocketConnected: (value: boolean) => void;
  setSyncing: (value: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: true,
  isSocketConnected: false,
  isSyncing: false,
  setOnline: (isOnline) => set({ isOnline }),
  setSocketConnected: (isSocketConnected) => set({ isSocketConnected }),
  setSyncing: (isSyncing) => set({ isSyncing }),
}));
