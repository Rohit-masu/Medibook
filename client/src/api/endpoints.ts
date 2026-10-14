import { api } from './client';
import type { AdminStats, Doctor, MrSummary, NewDoctorInput, User } from './types';

export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }).then((r) => r.data),
  verifyOtp: (phone: string, otp: string) =>
    api.post<{ token: string; user: User }>('/auth/verify-otp', { phone, otp }).then((r) => r.data),
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
};

export const doctorsApi = {
  list: (params: { search?: string; mr?: string; limit?: number } = {}) =>
    api.get<{ doctors: Doctor[] }>('/doctors', { params }).then((r) => r.data.doctors),
  get: (id: string) => api.get<{ doctor: Doctor }>(`/doctors/${id}`).then((r) => r.data.doctor),
  create: (input: NewDoctorInput) =>
    api.post<{ doctor: Doctor }>('/doctors', input).then((r) => r.data.doctor),
};

export const uploadsApi = {
  image: (file: Blob, filename = 'photo.jpg') => {
    const form = new FormData();
    form.append('image', file, filename);
    return api.post<{ url: string }>('/uploads/image', form).then((r) => r.data.url);
  },
};

export const adminApi = {
  stats: () => api.get<{ stats: AdminStats }>('/admin/stats').then((r) => r.data.stats),
  mrs: () => api.get<{ mrs: MrSummary[] }>('/admin/mrs').then((r) => r.data.mrs),
};
