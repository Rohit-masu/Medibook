import { asyncHandler } from '../middleware/error.js';
import { Doctor } from '../models/Doctor.js';
import { User } from '../models/User.js';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const getStats = asyncHandler(async (_req, res) => {
  const today = startOfToday();
  const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [totalDoctors, doctorsToday, doctorsThisWeek, totalMrs, activeMrIdsToday] = await Promise.all([
    Doctor.countDocuments(),
    Doctor.countDocuments({ createdAt: { $gte: today } }),
    Doctor.countDocuments({ createdAt: { $gte: weekAgo } }),
    User.countDocuments({ role: 'mr', isActive: true }),
    Doctor.distinct('onboardedBy', { createdAt: { $gte: today } }),
  ]);

  res.json({
    stats: {
      totalDoctors,
      doctorsToday,
      doctorsThisWeek,
      totalMrs,
      activeMrsToday: activeMrIdsToday.length,
    },
  });
});

export const listMrs = asyncHandler(async (_req, res) => {
  const mrs = await User.find({ role: 'mr' }).sort({ name: 1 }).lean();
  const counts = await Doctor.aggregate<{ _id: unknown; count: number; last: Date }>([
    { $group: { _id: '$onboardedBy', count: { $sum: 1 }, last: { $max: '$createdAt' } } },
  ]);
  const byMr = new Map(counts.map((c) => [String(c._id), c]));

  res.json({
    mrs: mrs.map((mr) => ({
      ...mr,
      doctorsOnboarded: byMr.get(String(mr._id))?.count ?? 0,
      lastOnboardedAt: byMr.get(String(mr._id))?.last ?? null,
    })),
  });
});
