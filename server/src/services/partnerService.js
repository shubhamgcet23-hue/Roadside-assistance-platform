import { PartnerProfile } from '../models/PartnerProfile.js';
import { calculateDistance, calculateETA, round1 } from '../utils/location.js';
import { estimatePrice, partnerBasePrice } from './pricing.js';

const MAX_SEARCH_KM = 100;
const hasLocation = (p) => !(p.location.coordinates[0] === 0 && p.location.coordinates[1] === 0);

/**
 * Verified partners that offer the service and whose own service radius covers the customer.
 * Sorted: AVAILABLE first, then nearest, then best rated.
 */
export async function findNearbyPartners({ latitude, longitude, service, onlyUserId }) {
  const query = {
    verificationStatus: 'VERIFIED',
    availability: { $ne: 'OFFLINE' },
    services: service.code,
    location: { $geoWithin: { $centerSphere: [[longitude, latitude], MAX_SEARCH_KM / 6378.1] } },
  };
  if (onlyUserId) query.userId = onlyUserId;
  const profiles = await PartnerProfile.find(query).populate('userId', 'name phone avatar role isActive');

  return profiles
    .filter((p) => p.userId?.isActive && hasLocation(p))
    .map((p) => {
      const [lng, lat] = p.location.coordinates;
      return { p, distanceKm: calculateDistance(latitude, longitude, lat, lng) };
    })
    .filter(({ p, distanceKm }) => distanceKm <= p.serviceRadiusKm)
    .map(({ p, distanceKm }) => ({
      partnerId: p.userId._id,
      name: p.userId.name,
      avatar: p.userId.avatar,
      role: p.userId.role,
      verified: true,
      rating: p.ratingAverage,
      reviews: p.ratingCount,
      jobsCompleted: p.jobsCompleted,
      availability: p.availability,
      services: p.services,
      experienceYears: p.experienceYears,
      distanceKm: round1(distanceKm),
      etaMinutes: calculateETA(distanceKm),
      location: { latitude: p.location.coordinates[1], longitude: p.location.coordinates[0] },
      pricing: estimatePrice(service, distanceKm, partnerBasePrice(p, service.code)),
    }))
    .sort((a, b) => (a.availability === b.availability ? 0 : a.availability === 'AVAILABLE' ? -1 : 1)
      || a.distanceKm - b.distanceKm || b.rating - a.rating);
}
