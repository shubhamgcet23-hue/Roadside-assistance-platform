import { Notification } from '../models/Notification.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { parsePage, pageMeta } from '../utils/paginate.js';

export const list = asyncHandler(async (req, res) => {
  const paging = parsePage(req.query, 20);
  const filter = { userId: req.user._id };
  const [notifications, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);
  res.json({ success: true, notifications, unread, ...pageMeta(total, paging) });
});

export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true });
  if (!n) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, notification: n });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});
