import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryEnabled, env } from '../config/env.js';
import { Image } from '../models/Image.js';

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

interface UploadInput {
  buffer: Buffer;
  mimetype: string;
  size: number;
  userId?: string;
}

/**
 * Stores an image and returns its URL.
 * Cloudinary returns an absolute URL; the MongoDB fallback returns a path
 * relative to the API origin (`/api/uploads/:id`) which the client resolves.
 */
export async function uploadImage({ buffer, mimetype, size, userId }: UploadInput): Promise<string> {
  if (cloudinaryEnabled) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'medbook/doctors', resource_type: 'image' }, (err, result) => {
          if (err || !result) return reject(err ?? new Error('Upload failed'));
          resolve(result.secure_url);
        })
        .end(buffer);
    });
  }

  const image = await Image.create({ data: buffer, contentType: mimetype, size, uploadedBy: userId });
  return `/api/uploads/${image.id}`;
}
