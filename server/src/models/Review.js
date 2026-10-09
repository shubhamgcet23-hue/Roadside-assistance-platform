import mongoose from "mongoose";
const schema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceRequest", required: true, unique: true }, // one review per request
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  rating: { type: Number, min: 1, max: 5, required: true }, comment: String,
}, { timestamps: true });
export const Review = mongoose.model("Review", schema);
