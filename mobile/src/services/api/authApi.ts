/**
 * درخواست‌های احراز هویت به سرور
 */
import type { AuthResponse } from '@/domain/types';
import { request } from './http';

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false });
}

export function register(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', { method: 'POST', body: { email, password }, auth: false });
}

// خروج از سمت سرور (توکن رفرش باطل میشه)
export function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' });
}
