import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as auth from '../controllers/auth.controller.js';
import * as doctors from '../controllers/doctors.controller.js';
import * as uploads from '../controllers/uploads.controller.js';
import * as admin from '../controllers/admin.controller.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const api = Router();

api.get('/health', (_req, res) => res.json({ ok: true }));

// Auth
api.post('/auth/send-otp', auth.sendOtp);
api.post('/auth/verify-otp', auth.verifyOtp);
api.get('/auth/me', requireAuth, auth.me);

// Uploads
api.post('/uploads/image', requireAuth, upload.single('image'), uploads.postImage);
api.get('/uploads/:id', uploads.getImage);

// Doctors
api.get('/doctors', requireAuth, doctors.listDoctors);
api.post('/doctors', requireAuth, requireRole('mr'), doctors.createDoctor);
api.get('/doctors/:id', requireAuth, doctors.getDoctor);

// Admin
api.get('/admin/stats', requireAuth, requireRole('admin'), admin.getStats);
api.get('/admin/mrs', requireAuth, requireRole('admin'), admin.listMrs);
