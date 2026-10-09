import { z } from 'zod';
import { Complaint } from '../models/Complaint.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { User } from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { notify } from '../services/notify.js';
import { parsePage, pageMeta } from '../utils/paginate.js';

const createSchema = z.object({
  requestId: z.string().min(1),
  category: z.enum(['OVERCHARGING', 'DELAY', 'BEHAVIOUR', 'POOR_SERVICE', 'OTHER']),
  description: z.string().trim().min(10, 'Please describe the problem in at least 10 characters').max(2000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  attachments: z.array(z.string().max(120)).max(3).optional(), // placeholder: file names only
});
const updateSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  adminNote: z.string().max(1000).optional(),
});

const populate = (q) => q
  .populate('userId', 'name email')
  .populate({ path: 'requestId', select: 'serviceType status createdAt partnerId', populate: { path: 'partnerId', select: 'name' } });

export const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const request = await ServiceRequest.findOne({ _id: data.requestId, userId: req.user._id });
  if (!request) throw new ApiError(404, 'Request not found');
  const complaint = await Complaint.create({ ...data, userId: req.user._id });
  const admins = await User.find({ role: 'ADMIN', isActive: true }).select('_id');
  await Promise.all(admins.map((a) => notify(a._id, 'COMPLAINT_UPDATE', 'New complaint', `${data.category} complaint filed`, { complaintId: complaint._id })));
  res.status(201).json({ success: true, complaint });
});

export const list = asyncHandler(async (req, res) => {
  const paging = parsePage(req.query);
  const filter = req.user.role === 'ADMIN' ? {} : { userId: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const [complaints, total] = await Promise.all([
    populate(Complaint.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit)),
    Complaint.countDocuments(filter),
  ]);
  res.json({ success: true, complaints, ...pageMeta(total, paging) });
});

export const update = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!complaint) throw new ApiError(404, 'Complaint not found');
  await notify(complaint.userId, 'COMPLAINT_UPDATE', 'Complaint updated', `Your complaint is now ${complaint.status.replace('_', ' ').toLowerCase()}.`, { complaintId: complaint._id });
  res.json({ success: true, complaint });
});
