import { z } from "zod";
import { Vehicle, VEHICLE_TYPES } from "../models/Vehicle.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";

const schema = z.object({
  type: z.enum(VEHICLE_TYPES), make: z.string().min(1), model: z.string().min(1),
  registrationNumber: z.string().min(4), year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1).optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID"]).optional(),
  color: z.string().optional(), isDefault: z.boolean().optional(),
});
const own = (req) => ({ _id: req.params.id, userId: req.user._id });
const clearDefaults = (userId) => Vehicle.updateMany({ userId }, { isDefault: false });

export const list = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, vehicles });
});
export const create = asyncHandler(async (req, res) => {
  const data = schema.parse(req.body);
  const first = !(await Vehicle.exists({ userId: req.user._id }));
  if (data.isDefault || first) { await clearDefaults(req.user._id); data.isDefault = true; }
  const vehicle = await Vehicle.create({ ...data, userId: req.user._id });
  res.status(201).json({ success: true, vehicle });
});
export const update = asyncHandler(async (req, res) => {
  const data = schema.partial().parse(req.body);
  if (data.isDefault) await clearDefaults(req.user._id);
  const vehicle = await Vehicle.findOneAndUpdate(own(req), data, { new: true, runValidators: true });
  if (!vehicle) throw new ApiError(404, "Vehicle not found");
  res.json({ success: true, vehicle });
});
export const remove = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndDelete(own(req));
  if (!vehicle) throw new ApiError(404, "Vehicle not found");
  if (vehicle.isDefault) await Vehicle.findOneAndUpdate({ userId: req.user._id }, { isDefault: true }, { sort: { createdAt: -1 } });
  res.json({ success: true });
});
