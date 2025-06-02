import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom hackathon icon
const hackathonIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// User location icon (optional)
const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const HackathonMap = ({ latitude, longitude,radius, hackathons }) => {
  if (!latitude || !longitude) {
    return <div className="text-center p-4 text-red-500">📍 Location not available</div>;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
      <MapContainer
        center={[latitude, longitude]}
        zoom={7}
        style={{ height: '60vh', width: '100%' }}
        scrollWheelZoom={true}
      >
<TileLayer
  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
/>

        {/* User's location marker */}
        <Marker position={[latitude, longitude]} icon={userIcon}>
          <Popup>
            <div className="text-sm font-semibold">📍 You are here</div>
          </Popup>
        </Marker>

        {/* Visual radius around the user (e.g., 50km) */}
        <Circle
          center={[latitude, longitude]}
          radius
          pathOptions={{ color: '#3b82f6', fillColor: '#93c5fd', fillOpacity: 0.3 }}
        />

        {/* Hackathon markers */}
        {hackathons.map((hackathon) => (
          <Marker
            key={hackathon.id}
            position={[hackathon.latitude, hackathon.longitude]}
            icon={hackathonIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong className="text-blue-700">{hackathon.title}</strong><br />
                📍 {hackathon.location}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default HackathonMap;
