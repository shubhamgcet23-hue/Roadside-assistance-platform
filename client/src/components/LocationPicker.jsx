import { useState } from 'react';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { Button, Input } from './ui/index.js';
import LazyMap from './LazyMap.jsx';
import { useLocate } from '../hooks/useLocate.js';
import { DEMO_LOCATION, geocode, reverseGeocode } from '../services/location.js';
import { getErrorMessage } from '../services/api.js';
import { LOCATION_KEY } from '../types/constants.js';

export function rememberLocation(loc) {
  try { localStorage.setItem(LOCATION_KEY, JSON.stringify(loc)); } catch { /* storage may be unavailable */ }
}
export function recallLocation() {
  try { return JSON.parse(localStorage.getItem(LOCATION_KEY)); } catch { return null; }
}

/**
 * Breakdown / base location chooser: browser GPS, address search, tapping or dragging a pin,
 * and a manual address field. value/onChange use { latitude, longitude, address }.
 */
export default function LocationPicker({ value, onChange, showDemo = true }) {
  const { locate, loading: locating, error: locateError } = useLocate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const commit = (loc) => { onChange(loc); rememberLocation(loc); };

  const setPin = async (latitude, longitude) => {
    commit({ latitude, longitude, address: 'Finding address...' });
    const address = await reverseGeocode(latitude, longitude);
    commit({ latitude, longitude, address });
  };

  const useGps = async () => {
    const pos = await locate();
    if (pos) setPin(pos.latitude, pos.longitude);
  };

  const search = async (e) => {
    e.preventDefault();
    if (query.trim().length < 3) return;
    setSearching(true);
    setSearchError(null);
    try {
      const rows = await geocode(query.trim());
      setResults(rows);
      if (!rows.length) setSearchError('No places found. Try a nearby landmark or tap the map.');
    } catch (err) {
      setSearchError(getErrorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const pick = (r) => { commit({ latitude: r.latitude, longitude: r.longitude, address: r.label }); setResults([]); setQuery(''); };
  const hasPin = Boolean(value && Number.isFinite(value.latitude));
  const center = hasPin ? [value.latitude, value.longitude] : [DEMO_LOCATION.latitude, DEMO_LOCATION.longitude];

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button size="lg" icon={LocateFixed} onClick={useGps} loading={locating} full>Use my current location</Button>
        {showDemo && (
          <Button size="lg" variant="secondary" icon={MapPin} full onClick={() => commit({ ...DEMO_LOCATION })}>Use demo location</Button>
        )}
      </div>
      {locateError && <p role="alert" className="rounded-xl bg-stop-50 px-4 py-3 text-sm text-stop-700">{locateError}</p>}

      <form onSubmit={search} className="flex gap-2" role="search">
        <Input className="flex-1" aria-label="Search address" placeholder="Search address or landmark" icon={Search} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button type="submit" variant="dark" size="lg" loading={searching} className="h-12">Search</Button>
      </form>
      {searchError && <p role="alert" className="text-sm text-stop-600">{searchError}</p>}
      {results.length > 0 && (
        <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200 bg-white">
          {results.map((r) => (
            <li key={`${r.latitude},${r.longitude}`}>
              <button type="button" onClick={() => pick(r)} className="block w-full px-4 py-3 text-left text-sm hover:bg-brand-50">{r.label}</button>
            </li>
          ))}
        </ul>
      )}

      <LazyMap
        center={center} zoom={hasPin ? 15 : 12} onPick={setPin} className="h-64 sm:h-80"
        markers={hasPin ? [{ id: 'me', position: center, kind: 'user', draggable: true, label: 'Your location' }] : []}
      />
      <p className="text-sm text-ink-500">Tap the map or drag the pin to fine-tune your exact spot.</p>

      <Input
        label="Address or landmark" placeholder="e.g. Near Pari Chowk petrol pump" value={value?.address || ''}
        onChange={(e) => hasPin && commit({ ...value, address: e.target.value })}
        disabled={!hasPin} hint={hasPin ? undefined : 'Set a location above first, then you can edit the address.'}
      />
    </div>
  );
}
