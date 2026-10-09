import mongoose from "mongoose";
export const VEHICLE_TYPES = ["CAR", "BIKE", "SCOOTER", "SUV", "COMMERCIAL", "OTHER"];
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: VEHICLE_TYPES, required: true },
  make: { type: String, required: true }, model: { type: String, required: true },
  registrationNumber: { type: String, required: true, uppercase: true },
  year: Number, fuelType: { type: String, enum: ["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID"] },
  color: String, isDefault: { type: Boolean, default: false },
}, { timestamps: true });
export const Vehicle = mongoose.model("Vehicle", schema);
