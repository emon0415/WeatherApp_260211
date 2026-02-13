
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// CSS is handled in index.html, removing the JS import to prevent runtime errors in ESM
// Fix for default marker icons in Leaflet when using ESM
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Props {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

const MapSelector: React.FC<Props> = ({ lat, lng, onLocationChange }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(containerRef.current).setView([lat, lng], 10);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initial marker
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    markerRef.current = marker;

    // Map click event
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationChange(lat, lng);
    });

    // Marker drag end event
    marker.on('dragend', () => {
      if (markerRef.current) {
        const position = markerRef.current.getLatLng();
        onLocationChange(position.lat, position.lng);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync component props to map state
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
        markerRef.current.setLatLng([lat, lng]);
        mapRef.current.panTo([lat, lng], { animate: true });
      }
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-full group">
      <div ref={containerRef} className="w-full h-full shadow-inner" />
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest pointer-events-none group-hover:bg-white transition-all">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
          LAT: {lat.toFixed(4)} / LNG: {lng.toFixed(4)}
        </div>
      </div>
      <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
        <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-lg">
          Click map to select
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
