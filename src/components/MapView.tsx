import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "./ui/card";
import { MapPin, DollarSign, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";

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

// Pre-populated coordinates for instant loading (top 100+ US cities and states)
const CITY_COORDINATES: Record<string, [number, number]> = {
  // Major US Cities
  'new york city': [40.7128, -74.0060], 'nyc': [40.7128, -74.0060],
  'los angeles': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298],
  'houston': [29.7604, -95.3698],
  'phoenix': [33.4484, -112.0740],
  'philadelphia': [39.9526, -75.1652],
  'san antonio': [29.4241, -98.4936],
  'san diego': [32.7157, -117.1611],
  'dallas': [32.7767, -96.7970],
  'san jose': [37.3382, -121.8863],
  'austin': [30.2672, -97.7431],
  'jacksonville': [30.3322, -81.6557],
  'fort worth': [32.7555, -97.3308],
  'columbus': [39.9612, -82.9988], // Columbus, OH (larger city)
  'charlotte': [35.2271, -80.8431],
  'san francisco': [37.7749, -122.4194], 'sf': [37.7749, -122.4194],
  'indianapolis': [39.7684, -86.1581],
  'seattle': [47.6062, -122.3321],
  'denver': [39.7392, -104.9903],
  'washington dc': [38.9072, -77.0369], 'dc': [38.9072, -77.0369],
  'boston': [42.3601, -71.0589],
  'nashville': [36.1627, -86.7816],
  'detroit': [42.3314, -83.0458],
  'portland': [45.5152, -122.6784],
  'memphis': [35.1495, -90.0490],
  'oklahoma city': [35.4676, -97.5164],
  'las vegas': [36.1699, -115.1398],
  'louisville': [38.2527, -85.7585],
  'baltimore': [39.2904, -76.6122],
  'milwaukee': [43.0389, -87.9065],
  'albuquerque': [35.0844, -106.6504],
  'tucson': [32.2226, -110.9747],
  'fresno': [36.7378, -119.7871],
  'mesa': [33.4152, -111.8315],
  'sacramento': [38.5816, -121.4944],
  'atlanta': [33.7490, -84.3880],
  'kansas city': [39.0997, -94.5786],
  'colorado springs': [38.8339, -104.8214],
  'raleigh': [35.7796, -78.6382],
  'miami': [25.7617, -80.1918],
  'long beach': [33.7701, -118.1937],
  'virginia beach': [36.8529, -75.9780],
  'oakland': [37.8044, -122.2712],
  'minneapolis': [44.9778, -93.2650],
  'tampa': [27.9506, -82.4572],
  'orlando': [28.5383, -81.3792],
  'st louis': [38.6270, -90.1994], 'saint louis': [38.6270, -90.1994],
  'pittsburgh': [40.4406, -79.9959],
  'cincinnati': [39.1031, -84.5120],
  'cleveland': [41.4993, -81.6944],
  'salt lake city': [40.7608, -111.8910],
  'anaheim': [33.8366, -117.9143],
  'riverside': [33.9806, -117.3755],
  'corpus christi': [27.8006, -97.3964],
  'lexington': [38.0406, -84.5037],
  'stockton': [37.9577, -121.2908],
  'anchorage': [61.2181, -149.9003],
  'newark': [40.7357, -74.1724],
  'plano': [33.0198, -96.6989],
  'buffalo': [42.8864, -78.8784],
  'henderson': [36.0395, -114.9817],
  'lincoln': [40.8136, -96.7026],
  'glendale': [33.5387, -112.1859],
  'chandler': [33.3062, -111.8413],
  'st paul': [44.9537, -93.0900], 'saint paul': [44.9537, -93.0900],
  'jersey city': [40.7178, -74.0431],
  'scottsdale': [33.4942, -111.9261],
  'norfolk': [36.8508, -76.2859],
  'madison': [43.0731, -89.4012],
  'birmingham': [33.5207, -86.8025],
  'baton rouge': [30.4515, -91.1871],
  'rochester': [43.1566, -77.6088],
  'richmond': [37.5407, -77.4360],
  'spokane': [47.6588, -117.4260],
  'des moines': [41.6005, -93.6091],
  'montgomery': [32.3668, -86.3000],
  'modesto': [37.6391, -120.9969],
  'fayetteville': [36.0626, -94.1574],
  'tacoma': [47.2529, -122.4443],
  'shreveport': [32.5252, -93.7502],
  'fontana': [34.0922, -117.4350],
  'oxnard': [34.1975, -119.1771],
  'aurora': [39.7294, -104.8319],
  'moreno valley': [33.9425, -117.2297],
  'akron': [41.0814, -81.5190],
  'yonkers': [40.9312, -73.8987],
  'augusta': [33.4735, -82.0105],
  // US States (fallback to state center)
  'california': [36.7783, -119.4179], 'ca': [36.7783, -119.4179],
  'texas': [31.9686, -99.9018], 'tx': [31.9686, -99.9018],
  'florida': [27.6648, -81.5158], 'fl': [27.6648, -81.5158],
  'new york': [42.1657, -74.9481], 'ny': [42.1657, -74.9481], // NY state center, not NYC
  'pennsylvania': [41.2033, -77.1945], 'pa': [41.2033, -77.1945],
  'illinois': [40.6331, -89.3985], 'il': [40.6331, -89.3985],
  'ohio': [40.4173, -82.9071], 'oh': [40.4173, -82.9071],
  'georgia': [32.1656, -82.9001], 'ga': [32.1656, -82.9001],
  'north carolina': [35.7596, -79.0193], 'nc': [35.7596, -79.0193],
  'michigan': [44.3148, -85.6024], 'mi': [44.3148, -85.6024],
  'new jersey': [40.0583, -74.4057], 'nj': [40.0583, -74.4057],
  'virginia': [37.4316, -78.6569], 'va': [37.4316, -78.6569],
  'washington': [47.7511, -120.7401], 'wa': [47.7511, -120.7401], // Washington state
  'arizona': [34.0489, -111.0937], 'az': [34.0489, -111.0937],
  'massachusetts': [42.4072, -71.3824], 'ma': [42.4072, -71.3824],
  'tennessee': [35.5175, -86.5804], 'tn': [35.5175, -86.5804],
  'indiana': [40.2672, -86.1349], 'in': [40.2672, -86.1349],
  'missouri': [37.9643, -91.8318], 'mo': [37.9643, -91.8318],
  'maryland': [39.0458, -76.6413], 'md': [39.0458, -76.6413],
  'wisconsin': [43.7844, -88.7879], 'wi': [43.7844, -88.7879],
  'colorado': [39.5501, -105.7821], 'co': [39.5501, -105.7821],
  'minnesota': [46.7296, -94.6859], 'mn': [46.7296, -94.6859],
  'south carolina': [33.8361, -81.1637], 'sc': [33.8361, -81.1637],
  'alabama': [32.3182, -86.9023], 'al': [32.3182, -86.9023],
  'louisiana': [31.2448, -92.1450],
  'kentucky': [37.8393, -84.2700], 'ky': [37.8393, -84.2700],
  'oregon': [43.8041, -120.5542], 'or': [43.8041, -120.5542],
  'oklahoma': [35.0078, -97.0929], 'ok': [35.0078, -97.0929],
  'connecticut': [41.6032, -73.0877], 'ct': [41.6032, -73.0877],
  'utah': [39.3210, -111.0937], 'ut': [39.3210, -111.0937],
  'nevada': [38.8026, -116.4194], 'nv': [38.8026, -116.4194],
};

// Cache for geocoded locations to avoid redundant API calls
const geocodeCache = new Map<string, [number, number]>();

// Function to get coordinates - instant for known cities, no API delays
const getCoordinatesForLocation = (location: string): [number, number] => {
  const normalizedLocation = location.toLowerCase().trim();

  // Check pre-populated city database FIRST (exact match - instant!)
  if (CITY_COORDINATES[normalizedLocation]) {
    const coords = CITY_COORDINATES[normalizedLocation];
    return [
      coords[0] + (Math.random() - 0.5) * 0.01,
      coords[1] + (Math.random() - 0.5) * 0.01
    ];
  }

  // Check runtime cache
  if (geocodeCache.has(normalizedLocation)) {
    const coords = geocodeCache.get(normalizedLocation)!;
    return [
      coords[0] + (Math.random() - 0.5) * 0.01,
      coords[1] + (Math.random() - 0.5) * 0.01
    ];
  }

  // Extract city name from "City, State" format and match more carefully
  const parts = normalizedLocation.split(',').map(p => p.trim());
  const cityPart = parts[0];
  const statePart = parts.length > 1 ? parts[1] : '';

  // Try exact city match first
  if (CITY_COORDINATES[cityPart]) {
    const coords = CITY_COORDINATES[cityPart];
    const randomCoords: [number, number] = [
      coords[0] + (Math.random() - 0.5) * 0.01,
      coords[1] + (Math.random() - 0.5) * 0.01
    ];
    geocodeCache.set(normalizedLocation, randomCoords);
    return randomCoords;
  }

  // Try state match as fallback
  if (statePart && CITY_COORDINATES[statePart]) {
    const coords = CITY_COORDINATES[statePart];
    const randomCoords: [number, number] = [
      coords[0] + (Math.random() - 0.5) * 0.01,
      coords[1] + (Math.random() - 0.5) * 0.01
    ];
    geocodeCache.set(normalizedLocation, randomCoords);
    return randomCoords;
  }

  // Only do substring matching for VERY specific cases to avoid false matches
  // Match only if the city name is at the START of the location string
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalizedLocation.startsWith(city + ',') || normalizedLocation.startsWith(city + ' ')) {
      const randomCoords: [number, number] = [
        coords[0] + (Math.random() - 0.5) * 0.01,
        coords[1] + (Math.random() - 0.5) * 0.01
      ];
      geocodeCache.set(normalizedLocation, randomCoords);
      return randomCoords;
    }
  }

  console.warn('Unknown location, using US center fallback:', location);

  // Fallback to center of US with some randomness
  const fallbackCoords: [number, number] = [
    39.8283 + (Math.random() - 0.5) * 10,
    -98.5795 + (Math.random() - 0.5) * 10
  ];
  geocodeCache.set(normalizedLocation, fallbackCoords);
  return fallbackCoords;
};

const MapView = ({ items, onItemClick }: MapViewProps) => {
  const [itemsWithCoords, setItemsWithCoords] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);

  useEffect(() => {
    // Geocode all items INSTANTLY (synchronous, no API calls for known cities)
    const itemsWithGeo: Item[] = items.map(item => {
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

    // Show ALL items immediately
    setItemsWithCoords(itemsWithGeo);

    // Calculate max price from items
    const max = Math.max(...items.map(item => item.price), 10000);
    setMaxPrice(max);
    setPriceRange([0, max]);
  }, [items]);

  // Filter items based on location search and price range
  useEffect(() => {
    let filtered = itemsWithCoords;

    // Filter by location
    if (locationSearch.trim()) {
      filtered = filtered.filter(item =>
        item.location.toLowerCase().includes(locationSearch.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter(item =>
      item.price >= priceRange[0] && item.price <= priceRange[1]
    );

    setFilteredItems(filtered);
  }, [itemsWithCoords, locationSearch, priceRange]);

  // Calculate center of map based on filtered items
  const center: [number, number] = filteredItems.length > 0
    ? [
        filteredItems.reduce((sum, item) => sum + (item.latitude || 0), 0) / filteredItems.length,
        filteredItems.reduce((sum, item) => sum + (item.longitude || 0), 0) / filteredItems.length
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
      {/* Filter Controls */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
        {/* Location Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search location..."
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            className="pl-9 bg-background/95 backdrop-blur-sm shadow-lg border-2"
          />
        </div>

        {/* Filter Toggle Button */}
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? "default" : "secondary"}
          size="icon"
          className="shadow-lg"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Price Filter Panel */}
      {showFilters && (
        <Card className="absolute top-20 left-4 right-4 z-[1000] p-4 bg-background/95 backdrop-blur-sm shadow-2xl border-2">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold">Price Range</label>
                <span className="text-sm text-muted-foreground">
                  ${priceRange[0]} - ${priceRange[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={maxPrice}
                step={50}
                value={priceRange}
                onValueChange={setPriceRange}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{filteredItems.length} listing{filteredItems.length !== 1 ? 's' : ''} found</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLocationSearch("");
                  setPriceRange([0, maxPrice]);
                }}
                className="h-7 text-xs"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

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

        {filteredItems.map((item) => (
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
