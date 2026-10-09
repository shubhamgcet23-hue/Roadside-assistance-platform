import mongoose from "mongoose";
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true }, title: { type: String, required: true }, message: String,
  data: mongoose.Schema.Types.Mixed, isRead: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ userId: 1, createdAt: -1 });
export const Notification = mongoose.model("Notification", schema);
