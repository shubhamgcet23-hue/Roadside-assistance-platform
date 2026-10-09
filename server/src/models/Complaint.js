import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  category: { type: String, enum: ['OVERCHARGING', 'DELAY', 'BEHAVIOUR', 'POOR_SERVICE', 'OTHER'], required: true },
  description: { type: String, required: true, maxlength: 2000 },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  status: { type: String, enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'], default: 'OPEN', index: true },
  attachments: [String], // placeholder: file names only, no storage in Phase 1
  adminNote: String,
}, { timestamps: true });
schema.index({ createdAt: -1 });
export const Complaint = mongoose.model('Complaint', schema);
