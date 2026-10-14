import { Schema, model } from 'mongoose';

// Fallback image store used when Cloudinary is not configured.
// Keeps uploads durable on hosts with ephemeral disks (e.g. Render free tier).
const imageSchema = new Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const Image = model('Image', imageSchema);
