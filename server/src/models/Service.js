import mongoose from "mongoose";
export const SERVICE_TYPES = ["BREAKDOWN_REPAIR", "TOWING", "BATTERY_JUMPSTART", "FLAT_TIRE", "FUEL_DELIVERY"];
const schema = new mongoose.Schema({
  code: { type: String, enum: SERVICE_TYPES, required: true, unique: true },
  name: { type: String, required: true }, description: String,
  basePrice: { type: Number, required: true, min: 0 }, pricePerKm: { type: Number, default: 0, min: 0 },
  estimatedDurationMin: Number, icon: String, isActive: { type: Boolean, default: true },
}, { timestamps: true });
export const Service = mongoose.model("Service", schema);
