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

// Cache for geocoded locations to avoid redundant API calls
const geocodeCache = new Map<string, [number, number]>();

// Function to geocode location strings using Nominatim API
const getCoordinatesForLocation = async (location: string): Promise<[number, number]> => {
  const normalizedLocation = location.toLowerCase().trim();

  // Check cache first
  if (geocodeCache.has(normalizedLocation)) {
    const coords = geocodeCache.get(normalizedLocation)!;
    // Add small randomness so items in same city don't stack exactly
    return [
      coords[0] + (Math.random() - 0.5) * 0.01,
      coords[1] + (Math.random() - 0.5) * 0.01
    ];
  }

  try {
    // Use Nominatim geocoding API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
      {
        headers: {
          'User-Agent': 'ReverseMarketplace/1.0'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        geocodeCache.set(normalizedLocation, coords);
        // Add small randomness
        return [
          coords[0] + (Math.random() - 0.5) * 0.01,
          coords[1] + (Math.random() - 0.5) * 0.01
        ];
      }
    }
  } catch (error) {
    console.error('Geocoding error for location:', location, error);
  }

  // Fallback to center of US with some randomness if geocoding fails
  return [
    39.8283 + (Math.random() - 0.5) * 10,
    -98.5795 + (Math.random() - 0.5) * 10
  ];
};

const MapView = ({ items, onItemClick }: MapViewProps) => {
  const [itemsWithCoords, setItemsWithCoords] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const geocodeItems = async () => {
      // First, immediately show items that already have coordinates or are in cache
      const itemsWithGeo: Item[] = [];
      const itemsNeedingGeocode: Item[] = [];

      // Separate items that need geocoding from those that don't
      for (const item of items) {
        if (item.latitude && item.longitude) {
          itemsWithGeo.push(item);
        } else if (geocodeCache.has(item.location.toLowerCase().trim())) {
          // Use cached coordinates immediately
          const [lat, lng] = await getCoordinatesForLocation(item.location);
          itemsWithGeo.push({
            ...item,
            latitude: lat,
            longitude: lng
          });
        } else {
          itemsNeedingGeocode.push(item);
        }
      }

      // Show cached items immediately
      setItemsWithCoords([...itemsWithGeo]);

      // Geocode remaining items in small batches with delays between batches
      if (itemsNeedingGeocode.length > 0) {
        setIsGeocoding(true);
        setGeocodingProgress({ current: 0, total: itemsNeedingGeocode.length });

        const batchSize = 3; // Process 3 items per batch
        const delayBetweenBatches = 1500; // 1.5 seconds between batches
        let processed = 0;

        for (let i = 0; i < itemsNeedingGeocode.length; i += batchSize) {
          const batch = itemsNeedingGeocode.slice(i, i + batchSize);

          // Geocode batch in parallel
          const geocodedBatch = await Promise.all(
            batch.map(async (item) => {
              const [lat, lng] = await getCoordinatesForLocation(item.location);
              return {
                ...item,
                latitude: lat,
                longitude: lng
              };
            })
          );

          // Add geocoded batch to existing items
          setItemsWithCoords(prev => [...prev, ...geocodedBatch]);

          // Update progress
          processed += batch.length;
          setGeocodingProgress({ current: processed, total: itemsNeedingGeocode.length });

          // Wait before processing next batch (unless this was the last batch)
          if (i + batchSize < itemsNeedingGeocode.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
          }
        }

        setIsGeocoding(false);
      }

      // Calculate max price from items
      const max = Math.max(...items.map(item => item.price), 10000);
      setMaxPrice(max);
      setPriceRange([0, max]);
    };

    geocodeItems();
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
      {/* Loading Indicator */}
      {isGeocoding && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-background/95 backdrop-blur-sm shadow-2xl rounded-full px-6 py-3 border-2 border-primary">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold">
              Loading locations... {geocodingProgress.current} / {geocodingProgress.total}
            </span>
          </div>
        </div>
      )}

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
