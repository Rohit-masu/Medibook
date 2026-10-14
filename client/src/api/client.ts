import axios, { AxiosError } from 'axios';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';
// Origin of the API server, used to resolve relative image paths like /api/uploads/:id.
const API_ORIGIN = API_URL.startsWith('http') ? new URL(API_URL).origin : '';

export const TOKEN_KEY = 'medbook.token';

export const api = axios.create({ baseURL: API_URL, timeout: 60_000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/send-otp') || error.config?.url?.startsWith('/auth/verify-otp');
    if (error.response?.status === 401 && !isAuthCall) onUnauthorized?.();
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.code === 'ECONNABORTED') return 'Server is taking too long. Please try again.';
    if (!error.response) return 'Cannot reach server. Check your internet connection.';
  }
  return fallback;
}

export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}
