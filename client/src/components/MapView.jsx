import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { TILE_ATTRIBUTION, TILE_URL } from '../services/location.js';
import { cn } from '../utils/cn.js';

const SVG = {
  user: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>',
  wrench: '<svg width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
};
const CONFIG = {
  user: { cls: 'pin pin--user', size: 30, html: SVG.user, extra: '' },
  mechanic: { cls: 'pin pin--mechanic', size: 40, html: SVG.wrench.replaceAll('{s}', '20'), extra: 'mechanic-marker' },
  partner: { cls: 'pin pin--partner', size: 30, html: SVG.wrench.replaceAll('{s}', '14'), extra: '' },
};
const iconCache = {};
const iconFor = (kind) => {
  if (!iconCache[kind]) {
    const c = CONFIG[kind] || CONFIG.partner;
    iconCache[kind] = L.divIcon({
      className: c.extra, html: `<div class="${c.cls}">${c.html}</div>`,
      iconSize: [c.size, c.size], iconAnchor: [c.size / 2, c.size / 2],
    });
  }
  return iconCache[kind];
};

function Picker({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function View({ center, points, fit }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (fit && points.length > 1) map.fitBounds(points, { padding: [48, 48], maxZoom: 16, animate: true });
    else if (center) map.setView(center, map.getZoom(), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fit, key, center?.[0], center?.[1]]);
  return null;
}

/**
 * Leaflet map. markers: [{ id, position: [lat, lng], kind: 'user'|'mechanic'|'partner', label?, draggable? }]
 * onPick(lat, lng) makes the map tappable and draggable markers report their new position.
 */
export default function MapView({ center, zoom = 14, markers = [], line, fit = false, onPick, className }) {
  const points = useMemo(() => markers.map((m) => m.position), [markers]);
  const start = center || points[0] || [28.4744, 77.504];
  return (
    <MapContainer center={start} zoom={zoom} scrollWheelZoom={false} className={cn('z-0 h-72 w-full overflow-hidden rounded-2xl', className)}>
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {onPick && <Picker onPick={onPick} />}
      <View center={center} points={points} fit={fit} />
      {line && <Polyline positions={line} pathOptions={{ color: '#161c22', weight: 4, dashArray: '2 10', lineCap: 'round' }} />}
      {markers.map((m) => (
        <Marker
          key={m.id} position={m.position} icon={iconFor(m.kind)} draggable={Boolean(m.draggable && onPick)}
          eventHandlers={m.draggable && onPick ? { dragend: (e) => { const p = e.target.getLatLng(); onPick(p.lat, p.lng); } } : undefined}
        >
          {m.label && <Popup>{m.label}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
}
