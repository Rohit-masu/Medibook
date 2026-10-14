import { asyncHandler, AppError } from '../middleware/error.js';
import { Image } from '../models/Image.js';
import { uploadImage } from '../services/upload.service.js';

export const postImage = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new AppError(400, 'No image received');
  if (!file.mimetype.startsWith('image/')) throw new AppError(400, 'Only image files are allowed');

  const url = await uploadImage({
    buffer: file.buffer,
    mimetype: file.mimetype,
    size: file.size,
    userId: req.user?.id,
  });
  res.status(201).json({ url });
});

// Public so <img> tags can load it; ids are unguessable ObjectIds.
export const getImage = asyncHandler(async (req, res) => {
  const image = await Image.findById(req.params.id);
  if (!image) throw new AppError(404, 'Image not found');
  res.set('Content-Type', image.contentType);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(image.data);
});
