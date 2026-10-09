import { z } from 'zod';
import { Review } from '../models/Review.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { PartnerProfile } from '../models/PartnerProfile.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { notify } from '../services/notify.js';
import { parsePage, pageMeta } from '../utils/paginate.js';

const schema = z.object({
  requestId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const create = asyncHandler(async (req, res) => {
  const { requestId, rating, comment } = schema.parse(req.body);
  const request = await ServiceRequest.findOne({ _id: requestId, userId: req.user._id });
  if (!request) throw new ApiError(404, 'Request not found');
  if (request.status !== 'COMPLETED' || !request.partnerId) throw new ApiError(400, 'You can only review a completed service');
  if (await Review.exists({ requestId })) throw new ApiError(409, 'You have already reviewed this service');

  const review = await Review.create({ requestId, userId: req.user._id, partnerId: request.partnerId, rating, comment });
  request.rating = rating;
  request.review = comment;
  await request.save();

  const [stats] = await Review.aggregate([
    { $match: { partnerId: request.partnerId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await PartnerProfile.updateOne({ userId: request.partnerId }, {
    ratingAverage: Math.round(stats.avg * 10) / 10, ratingCount: stats.count,
  });
  await notify(request.partnerId, 'REVIEW', 'New review', `You received ${rating} star${rating > 1 ? 's' : ''}.`, { requestId });
  res.status(201).json({ success: true, review });
});

export const listForPartner = asyncHandler(async (req, res) => {
  const paging = parsePage(req.query);
  const filter = { partnerId: req.params.id };
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).populate('userId', 'name'),
    Review.countDocuments(filter),
  ]);
  res.json({ success: true, reviews, ...pageMeta(total, paging) });
});
