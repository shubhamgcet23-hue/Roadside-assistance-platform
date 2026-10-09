import { z } from "zod";
import { Service, SERVICE_TYPES } from "../models/Service.js";
import { ApiError, asyncHandler } from "../utils/ApiError.js";
const schema = z.object({
  code: z.enum(SERVICE_TYPES), name: z.string().min(2), description: z.string().optional(),
  basePrice: z.number().min(0), pricePerKm: z.number().min(0).default(0),
  estimatedDurationMin: z.number().min(1).optional(), icon: z.string().optional(), isActive: z.boolean().optional(),
});
export const list = asyncHandler(async (req, res) => {
  const filter = req.user?.role === "ADMIN" && req.query.all === "true" ? {} : { isActive: true };
  res.json({ success: true, services: await Service.find(filter).sort({ basePrice: 1 }) });
});
export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, service: await Service.create(schema.parse(req.body)) });
});
export const update = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, schema.partial().parse(req.body), { new: true });
  if (!service) throw new ApiError(404, "Service not found");
  res.json({ success: true, service });
});
/** Soft delete: deactivate so historical requests keep their reference. */
export const remove = asyncHandler(async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!service) throw new ApiError(404, "Service not found");
  res.json({ success: true, service });
});
