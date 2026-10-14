import { z } from 'zod';
import type { FilterQuery } from 'mongoose';
import { asyncHandler, AppError } from '../middleware/error.js';
import { Doctor, SPECIALTIES, type DoctorAttrs } from '../models/Doctor.js';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  mr: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

const createDoctorSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name is required').max(100),
  phone: z
    .string({ required_error: 'Mobile number is required' })
    .trim()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  specialty: z.enum(SPECIALTIES, { errorMap: () => ({ message: 'Select a valid specialty' }) }),
  registrationNo: z.string().trim().max(50).optional().or(z.literal('')),
  clinicName: z.string({ required_error: 'Clinic name is required' }).trim().min(2, 'Clinic name is required').max(150),
  address: z.string({ required_error: 'Address is required' }).trim().min(5, 'Address is required').max(300),
  city: z.string({ required_error: 'City is required' }).trim().min(2, 'City is required').max(80),
  photoUrl: z.string({ required_error: 'Doctor photo is required' }).trim().min(1, 'Doctor photo is required'),
});

export const listDoctors = asyncHandler(async (req, res) => {
  const { search, mr, limit } = listQuerySchema.parse(req.query);
  const filter: FilterQuery<DoctorAttrs> = {};

  // MRs only ever see the doctors they onboarded.
  if (req.user!.role === 'mr') filter.onboardedBy = req.user!._id;
  else if (mr) filter.onboardedBy = mr;

  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { clinicName: rx }, { city: rx }, { phone: rx }, { specialty: rx }];
  }

  const doctors = await Doctor.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('onboardedBy', 'name phone territory');

  res.json({ doctors });
});

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate('onboardedBy', 'name phone territory');
  if (!doctor) throw new AppError(404, 'Doctor not found');

  const ownerId = (doctor.onboardedBy as unknown as { _id: unknown })?._id?.toString();
  if (req.user!.role === 'mr' && ownerId !== req.user!.id) {
    throw new AppError(404, 'Doctor not found');
  }
  res.json({ doctor });
});

export const createDoctor = asyncHandler(async (req, res) => {
  const data = createDoctorSchema.parse(req.body);

  const existing = await Doctor.findOne({ phone: data.phone }).populate('onboardedBy', 'name');
  if (existing) {
    const by = (existing.onboardedBy as unknown as { name?: string })?.name;
    throw new AppError(
      409,
      `Dr. ${existing.name} is already registered with this number${by ? ` (by ${by})` : ''}.`,
    );
  }

  const doctor = await Doctor.create({
    ...data,
    registrationNo: data.registrationNo || undefined,
    onboardedBy: req.user!._id,
    status: 'active',
  });
  await doctor.populate('onboardedBy', 'name phone territory');
  res.status(201).json({ doctor });
});
