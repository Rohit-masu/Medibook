import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, type Role, type UserDoc } from '../models/User.js';
import { AppError, asyncHandler } from './error.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDoc;
    }
  }
}

interface TokenPayload {
  sub: string;
  role: Role;
}

export function signToken(user: UserDoc) {
  const payload: TokenPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new AppError(401, 'Please log in');

  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    throw new AppError(401, 'Session expired, please log in again');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new AppError(401, 'Account not found or inactive');
  req.user = user;
  next();
});

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have access to this action'));
    }
    next();
  };
