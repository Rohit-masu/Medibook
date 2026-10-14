import { Schema, model, type InferSchemaType } from 'mongoose';

export const SPECIALTIES = [
  'General Physician',
  'Cardiologist',
  'Diabetologist',
  'Pediatrician',
  'Dermatologist',
  'Gynecologist',
  'Orthopedic',
  'ENT',
  'Other',
] as const;

// Only 'active' is used today; 'pending' | 'approved' | 'rejected' are reserved for the approval workflow.
export const DOCTOR_STATUSES = ['active', 'pending', 'approved', 'rejected'] as const;

const doctorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    specialty: { type: String, enum: SPECIALTIES, required: true },
    registrationNo: { type: String, trim: true },
    clinicName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    photoUrl: { type: String, required: true },
    onboardedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: DOCTOR_STATUSES, default: 'active' },
  },
  { timestamps: true },
);

doctorSchema.index({ phone: 1 });
doctorSchema.index({ createdAt: -1 });

export type DoctorAttrs = InferSchemaType<typeof doctorSchema>;
export const Doctor = model('Doctor', doctorSchema);
