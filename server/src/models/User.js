import mongoose from "mongoose";
import bcrypt from "bcryptjs";
export const ROLES = ["USER", "MECHANIC", "TOWING_PARTNER", "ADMIN"];
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, default: "USER" },
  avatar: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
schema.pre("save", async function (next) {
  if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 12);
  next();
});
schema.methods.comparePassword = function (plain) { return bcrypt.compare(plain, this.password); };
schema.set("toJSON", { transform: (_d, r) => { delete r.password; delete r.__v; return r; } });
export const User = mongoose.model("User", schema);
