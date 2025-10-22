import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapProps {
  location: string;
}

// Component to recenter map when coordinates change
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function LocationMap({ location }: LocationMapProps) {
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Geocode the location string to get coordinates
    const geocodeLocation = async () => {
      try {
        // Using Nominatim (OpenStreetMap) geocoding - free and no API key needed
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setCoordinates([lat, lon]);
        } else {
          // Default to center of US if location not found
          setCoordinates([39.8283, -98.5795]);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Default to center of US on error
        setCoordinates([39.8283, -98.5795]);
      } finally {
        setLoading(false);
      }
    };

    geocodeLocation();
  }, [location]);

  if (loading) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Unable to load map</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={coordinates}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={coordinates} />
        {/* Circle zone showing approximate area */}
        <Circle
          center={coordinates}
          radius={5000} // 5km radius
          pathOptions={{
            fillColor: 'hsl(43, 43%, 58%)',
            fillOpacity: 0.2,
            color: 'hsl(43, 43%, 58%)',
            weight: 2,
            opacity: 0.6
          }}
        />
        {/* Center marker */}
        <Marker position={coordinates} />
      </MapContainer>
    </div>
  );
}
