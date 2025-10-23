import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "./ui/card";
import { MapPin, DollarSign } from "lucide-react";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Item {
  id: string;
  title: string;
  brand: string;
  price: number;
  condition: string;
  location: string;
  images: string[];
  user_id: string;
  description: string;
  category: string;
  latitude?: number;
  longitude?: number;
}

interface MapViewProps {
  items: Item[];
  onItemClick: (item: Item) => void;
}

// Function to geocode location strings (simplified - in production use a real geocoding API)
const getCoordinatesForLocation = (location: string): [number, number] => {
  // Mock coordinates for common cities - in production, use a geocoding service
  const cityCoordinates: { [key: string]: [number, number] } = {
    "new york": [40.7128, -74.0060],
    "los angeles": [34.0522, -118.2437],
    "chicago": [41.8781, -87.6298],
    "houston": [29.7604, -95.3698],
    "miami": [25.7617, -80.1918],
    "san francisco": [37.7749, -122.4194],
    "seattle": [47.6062, -122.3321],
    "boston": [42.3601, -71.0589],
    "atlanta": [33.7490, -84.3880],
    "dallas": [32.7767, -96.7970],
    "philadelphia": [39.9526, -75.1652],
    "phoenix": [33.4484, -112.0740],
    "san diego": [32.7157, -117.1611],
    "denver": [39.7392, -104.9903],
    "austin": [30.2672, -97.7431],
  };

  const normalizedLocation = location.toLowerCase().trim();

  // Check for exact city match
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (normalizedLocation.includes(city)) {
      // Add some randomness so items in same city don't stack
      return [
        coords[0] + (Math.random() - 0.5) * 0.1,
        coords[1] + (Math.random() - 0.5) * 0.1
      ];
    }
  }

  // Default to center of US with some randomness
  return [
    39.8283 + (Math.random() - 0.5) * 10,
    -98.5795 + (Math.random() - 0.5) * 10
  ];
};

const MapView = ({ items, onItemClick }: MapViewProps) => {
  const [itemsWithCoords, setItemsWithCoords] = useState<Item[]>([]);

  useEffect(() => {
    // Add coordinates to items that don't have them
    const itemsWithGeo = items.map(item => {
      if (item.latitude && item.longitude) {
        return item;
      }
      const [lat, lng] = getCoordinatesForLocation(item.location);
      return {
        ...item,
        latitude: lat,
        longitude: lng
      };
    });
    setItemsWithCoords(itemsWithGeo);
  }, [items]);

  // Calculate center of map based on items
  const center: [number, number] = itemsWithCoords.length > 0
    ? [
        itemsWithCoords.reduce((sum, item) => sum + (item.latitude || 0), 0) / itemsWithCoords.length,
        itemsWithCoords.reduce((sum, item) => sum + (item.longitude || 0), 0) / itemsWithCoords.length
      ]
    : [39.8283, -98.5795]; // Center of US

  // Custom marker icon
  const customIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={4}
        className="h-full w-full rounded-lg"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {itemsWithCoords.map((item) => (
          <Marker
            key={item.id}
            position={[item.latitude!, item.longitude!]}
            icon={customIcon}
          >
            <Popup>
              <Card className="border-0 shadow-none p-0 min-w-[250px]">
                <div className="space-y-2">
                  {/* Image */}
                  {item.images && item.images.length > 0 && (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.brand}</p>

                    <div className="flex items-center gap-1 text-primary">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-bold text-sm">${item.price}</span>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs">{item.location}</span>
                    </div>
                  </div>

                  {/* View Button */}
                  <button
                    onClick={() => onItemClick(item)}
                    className="w-full bg-primary text-primary-foreground py-2 px-3 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    View Listing
                  </button>
                </div>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
