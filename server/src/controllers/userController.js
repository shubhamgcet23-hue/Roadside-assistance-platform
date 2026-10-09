import { z } from "zod";
import { asyncHandler } from "../utils/ApiError.js";
const schema = z.object({ name: z.string().min(2).optional(), phone: z.string().regex(/^\+?[0-9]{10,13}$/).optional(), avatar: z.string().url().optional() });
export const getProfile = asyncHandler(async (req, res) => res.json({ success: true, user: req.user }));
export const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, schema.parse(req.body));
  await req.user.save();
  res.json({ success: true, user: req.user });
});
