import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/error.js';
import { signToken } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { otpService } from '../services/otp.service.js';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

const sendOtpSchema = z.object({ phone: phoneSchema });
const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

async function findActiveUser(phone: string) {
  const user = await User.findOne({ phone });
  if (!user || !user.isActive) {
    throw new AppError(404, 'This number is not registered. Please contact your admin.');
  }
  return user;
}

export const sendOtp = asyncHandler(async (req, res) => {
  const { phone } = sendOtpSchema.parse(req.body);
  await findActiveUser(phone);
  await otpService.send(phone);
  res.json({ success: true, message: 'OTP sent' });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = verifyOtpSchema.parse(req.body);
  const user = await findActiveUser(phone);
  const valid = await otpService.verify(phone, otp);
  if (!valid) throw new AppError(400, 'Incorrect OTP. Please try again.');
  res.json({ token: signToken(user), user });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
