// Location service. Leaflet + OpenStreetMap (Nominatim) today; swap this file's functions to move to
// Google Maps / Mapbox later without touching any component.
export const DEMO_LOCATION = {
  latitude: Number(import.meta.env.VITE_DEMO_LAT) || 28.4744,
  longitude: Number(import.meta.env.VITE_DEMO_LNG) || 77.504,
  address: 'Demo area (seeded partners nearby)',
};

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported on this device. Please enter your location manually.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => {
        if (err.code === 1) reject(new Error('Location permission denied. Please enter your location manually.'));
        else if (err.code === 3) reject(new Error('Finding your location took too long. Try again or enter it manually.'));
        else reject(new Error('Could not detect your location. Please enter it manually.'));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 },
    );
  });
}

export function watchPosition(onPosition, onError) {
  if (!navigator.geolocation) { onError(new Error('Location is not supported on this device.')); return () => {}; }
  const id = navigator.geolocation.watchPosition(
    (pos) => onPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    () => onError(new Error('Location permission denied or unavailable.')),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';

export async function geocode(query) {
  const res = await fetch(`${NOMINATIM}/search?format=json&limit=5&q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Address search is unavailable right now. Tap the map to drop a pin instead.');
  const rows = await res.json();
  return rows.map((r) => ({ label: r.display_name, latitude: Number(r.lat), longitude: Number(r.lon) }));
}

export async function reverseGeocode(latitude, longitude) {
  try {
    const res = await fetch(`${NOMINATIM}/reverse?format=json&lat=${latitude}&lon=${longitude}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('reverse failed');
    const data = await res.json();
    return data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  } catch {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
}

export const directionsUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
