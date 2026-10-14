import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, 'Route not found'));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  if (err instanceof ZodError) {
    // Schemas carry user-facing messages, so surface the first one as-is.
    return res.status(400).json({ success: false, message: err.issues[0]?.message ?? 'Invalid input' });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5MB)' : err.message;
    return res.status(400).json({ success: false, message });
  }
  if (err && typeof err === 'object' && (err as { name?: string }).name === 'CastError') {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: 'Something went wrong' });
}
