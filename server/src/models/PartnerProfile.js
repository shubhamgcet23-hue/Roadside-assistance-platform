import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  experienceYears: { type: Number, default: 0 },
  governmentIdRef: String, // placeholder: no document storage in Phase 1
  licenseRef: String, // placeholder
  address: String,
  services: [{ type: String }],
  pricing: [{ _id: false, serviceCode: String, basePrice: Number }], // optional per-service base price override
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  serviceRadiusKm: { type: Number, default: 15 },
  availability: { type: String, enum: ['AVAILABLE', 'BUSY', 'OFFLINE'], default: 'OFFLINE' },
  verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'], default: 'PENDING', index: true },
  verifiedAt: Date,
  rejectionReason: String,
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  jobsCompleted: { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ location: '2dsphere' });
export const PartnerProfile = mongoose.model('PartnerProfile', schema);
