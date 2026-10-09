const EARTH_KM = 6371;
const rad = (d) => (d * Math.PI) / 180;

/** Haversine distance in km (mirrors the server so the UI can show instant estimates). */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}

export const etaMinutes = (km, speedKmh = 30) => Math.max(1, Math.ceil((km / speedKmh) * 60));
export const isValidCoord = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
