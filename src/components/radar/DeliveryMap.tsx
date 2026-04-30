import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths (Leaflet + bundlers)
const customerIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:hsl(var(--primary));border:3px solid #fff;box-shadow:0 0 14px hsl(var(--primary)/0.8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});
const providerIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="width:34px;height:34px;border-radius:50%;background:#f97316;border:3px solid #fff;box-shadow:0 0 16px rgba(249,115,22,0.9);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;animation:pulse 1.4s infinite;">🏍️</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

interface DeliveryMapProps {
  customer: [number, number];
  providerStart: [number, number];
  /** progresso 0..1 do trajeto entre prestador e cliente */
  progress: number;
  active?: boolean;
}

function FitBounds({ a, b }: { a: [number, number]; b: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([a, b]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
  }, [a, b, map]);
  return null;
}

export function DeliveryMap({ customer, providerStart, progress, active = true }: DeliveryMapProps) {
  // Linear interpolation (suficiente para simulação visual)
  const current: [number, number] = useMemo(
    () => [
      providerStart[0] + (customer[0] - providerStart[0]) * progress,
      providerStart[1] + (customer[1] - providerStart[1]) * progress,
    ],
    [providerStart, customer, progress],
  );

  const polyline = useMemo<[number, number][]>(
    () => [providerStart, current, customer],
    [providerStart, current, customer],
  );

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-primary/30">
      <MapContainer
        center={customer}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', background: '#0b1220' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
        />
        <FitBounds a={providerStart} b={customer} />

        <Polyline
          positions={polyline.slice(0, 2)}
          pathOptions={{ color: '#22d3ee', weight: 4, opacity: 0.9, dashArray: '8 6' }}
        />
        <Polyline
          positions={[current, customer]}
          pathOptions={{ color: '#22d3ee44', weight: 3, opacity: 0.5, dashArray: '4 6' }}
        />

        <Marker position={customer} icon={customerIcon} />
        {active && <Marker position={current} icon={providerIcon} />}
      </MapContainer>
    </div>
  );
}

export default DeliveryMap;
