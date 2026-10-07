/**
 * درخواست‌های وظایف و یادداشت‌ها به سرور
 */
import type { CreatePayload, Item, ItemsPage, UpdatePayload } from '@/domain/types';
import { request } from './http';

export function createItem(payload: CreatePayload): Promise<Item> {
  return request<Item>('/items', { method: 'POST', body: payload });
}

export function updateItem(id: string, payload: UpdatePayload): Promise<Item> {
  return request<Item>(`/items/${id}`, { method: 'PATCH', body: payload });
}

export function deleteItem(id: string): Promise<void> {
  return request<void>(`/items/${id}`, { method: 'DELETE' });
}

// همه‌ی تغییرات (حتی حذف‌شده‌ها) بعد از یک زمان مشخص، صفحه به صفحه
export function fetchChanges(updatedSince: string, cursor?: string): Promise<ItemsPage> {
  const params = new URLSearchParams({ updatedSince, limit: '200' });
  if (cursor) params.set('cursor', cursor);
  return request<ItemsPage>(`/items?${params.toString()}`);
}
