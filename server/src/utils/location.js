const EARTH_RADIUS_KM = 6371;
const rad = (d) => (d * Math.PI) / 180;

/** Haversine great-circle distance in kilometres. */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** ETA in whole minutes (minimum 1). averageSpeed is km/h and configurable via AVG_SPEED_KMH. */
export function calculateETA(distanceKm, averageSpeed = Number(process.env.AVG_SPEED_KMH) || 30) {
  return Math.max(1, Math.ceil((distanceKm / averageSpeed) * 60));
}

export const round1 = (n) => Math.round(n * 10) / 10;
