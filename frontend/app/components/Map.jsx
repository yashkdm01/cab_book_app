'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Map({ driverLocation }) {
  const center = driverLocation ? [driverLocation.lat, driverLocation.lon] : [19.0760, 72.8777];

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden shadow-2xl border border-white/20 z-0 relative">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lon]}>
            <Popup>Driver is here!</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}