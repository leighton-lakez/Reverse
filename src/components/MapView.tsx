import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Card } from "./ui/card";
import { MapPin, DollarSign, Search, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { useNavigate } from "react-router-dom";

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
  videos?: string[];
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

// Load cache from localStorage on init
const loadGeocodeCacheFromStorage = () => {
  try {
    const stored = localStorage.getItem('geocodeCache');
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]) => {
        geocodeCache.set(key, value as [number, number]);
      });
      console.log('📦 Loaded', geocodeCache.size, 'cached locations from storage');
    }
  } catch (e) {
    console.error('Failed to load geocode cache:', e);
  }
};

// Save cache to localStorage
const saveGeocodeCacheToStorage = () => {
  try {
    const cacheObj: Record<string, [number, number]> = {};
    geocodeCache.forEach((value, key) => {
      cacheObj[key] = value;
    });
    localStorage.setItem('geocodeCache', JSON.stringify(cacheObj));
  } catch (e) {
    console.error('Failed to save geocode cache:', e);
  }
};

// Initialize cache on module load
loadGeocodeCacheFromStorage();

// Async function to geocode using API for unknown locations
const geocodeWithAPI = async (location: string): Promise<[number, number]> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&countrycodes=us&limit=1`,
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
        console.log(`✅ Geocoded "${location}" via API:`, coords);
        geocodeCache.set(location.toLowerCase().trim(), coords);
        saveGeocodeCacheToStorage(); // Save to localStorage
        return coords;
      }
    }
  } catch (error) {
    console.error('Geocoding API error for:', location, error);
  }

  // Ultimate fallback
  console.warn('❌ Geocoding failed for:', location, '- using US center');
  return [39.8283, -98.5795];
};

// Synchronous function for instant lookup, returns null if needs API call
const getCoordinatesSync = (location: string): [number, number] | null => {
  const normalizedLocation = location.toLowerCase().trim();

  console.log('🔍 Geocoding:', location);

  // Check pre-populated city database FIRST (exact match - instant!)
  if (CITY_COORDINATES[normalizedLocation]) {
    const coords = CITY_COORDINATES[normalizedLocation];
    console.log('  ✅ Exact match found:', normalizedLocation, '→', coords);
    return [
      coords[0] + (Math.random() - 0.5) * 0.01,
      coords[1] + (Math.random() - 0.5) * 0.01
    ];
  }

  // Check runtime cache
  if (geocodeCache.has(normalizedLocation)) {
    const coords = geocodeCache.get(normalizedLocation)!;
    console.log('  ✅ Cache hit:', normalizedLocation);
    return [
      coords[0] + (Math.random() - 0.5) * 0.01,
      coords[1] + (Math.random() - 0.5) * 0.01
    ];
  }

  // Extract city name from "City, State" format and match more carefully
  const parts = normalizedLocation.split(',').map(p => p.trim());
  const cityPart = parts[0];
  const statePart = parts.length > 1 ? parts[1] : '';

  console.log('  📍 Parsed:', { city: cityPart, state: statePart });

  // Try exact city match first
  if (CITY_COORDINATES[cityPart]) {
    const coords = CITY_COORDINATES[cityPart];
    console.log('  ✅ City match:', cityPart, '→', coords);
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
    console.log('  ⚠️ Using state fallback:', statePart, '→', coords);
    const randomCoords: [number, number] = [
      coords[0] + (Math.random() - 0.5) * 0.01,
      coords[1] + (Math.random() - 0.5) * 0.01
    ];
    geocodeCache.set(normalizedLocation, randomCoords);
    return randomCoords;
  }

  // Only do substring matching for VERY specific cases to avoid false matches
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalizedLocation.startsWith(city + ',') || normalizedLocation.startsWith(city + ' ')) {
      console.log('  ✅ Prefix match:', city, '→', coords);
      const randomCoords: [number, number] = [
        coords[0] + (Math.random() - 0.5) * 0.01,
        coords[1] + (Math.random() - 0.5) * 0.01
      ];
      geocodeCache.set(normalizedLocation, randomCoords);
      return randomCoords;
    }
  }

  console.log('  ⏳ Needs API geocoding:', location);
  return null; // Signal that API call is needed
};

// Component to handle map centering and resizing
const MapUpdater = ({ center, zoom, triggerResize, mapRef }: { center: [number, number], zoom: number, triggerResize?: number | null, mapRef?: React.MutableRefObject<L.Map | null> }) => {
  const map = useMap();

  useEffect(() => {
    if (mapRef) {
      mapRef.current = map;
    }
  }, [map, mapRef]);

  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.5 });
  }, [center, zoom, map]);

  useEffect(() => {
    // Invalidate size when container dimensions change (e.g., sidebar moves)
    if (triggerResize !== undefined && triggerResize !== null) {
      setTimeout(() => {
        map.invalidateSize();
      }, 350); // Wait for sidebar animation to complete
    }
  }, [triggerResize, map]);

  return null;
};

const MapView = ({ items, onItemClick }: MapViewProps) => {
  const navigate = useNavigate();
  const [itemsWithCoords, setItemsWithCoords] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]);
  const [mapZoom, setMapZoom] = useState(4);
  const [geocodingProgress, setGeocodingProgress] = useState<{ current: number; total: number } | null>(null);
  const [popupItem, setPopupItem] = useState<Item | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Swipe functionality for mobile
  // Initialize with list hidden on mobile (will be set properly in useEffect)
  const [sidebarOffset, setSidebarOffset] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Initialize sidebar offset - hidden on mobile, visible on desktop
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Start with list hidden on mobile - calculate width after mount
      const sidebarWidth = sidebarRef.current?.offsetWidth || window.innerWidth * 0.75;
      setSidebarOffset(-sidebarWidth);
    } else {
      setSidebarOffset(0);
    }
  }, []);

  useEffect(() => {
    const geocodeItems = async () => {
      console.log('📍 Starting geocoding for', items.length, 'items');

      // Phase 1: Instant sync geocoding for known cities
      const instantItems: Item[] = [];
      const needsAPIItems: { item: Item; index: number }[] = [];

      items.forEach((item, index) => {
        if (item.latitude && item.longitude) {
          instantItems.push(item);
          return;
        }

        const coords = getCoordinatesSync(item.location);
        if (coords) {
          // Got instant coordinates
          instantItems.push({
            ...item,
            latitude: coords[0],
            longitude: coords[1]
          });
        } else {
          // Needs API call
          needsAPIItems.push({ item, index });
        }
      });

      // Show instant items immediately
      console.log('⚡ Showing', instantItems.length, 'items instantly');
      setItemsWithCoords([...instantItems]);

      // Phase 2: Geocode unknown locations via API (with delay to respect rate limits)
      if (needsAPIItems.length > 0) {
        console.log('⏳ Need to geocode', needsAPIItems.length, 'items via API (this may take a moment...)');
        setGeocodingProgress({ current: 0, total: needsAPIItems.length });

        // Process in background without blocking the UI
        (async () => {
          const apiGeocodedItems: Item[] = [];

          for (let i = 0; i < needsAPIItems.length; i++) {
            const { item } = needsAPIItems[i];

            // Update progress
            setGeocodingProgress({ current: i + 1, total: needsAPIItems.length });

            // Add delay between API calls (1 req/sec limit)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 1100));
            }

            const coords = await geocodeWithAPI(item.location);
            const geocodedItem = {
              ...item,
              latitude: coords[0] + (Math.random() - 0.5) * 0.01,
              longitude: coords[1] + (Math.random() - 0.5) * 0.01
            };

            apiGeocodedItems.push(geocodedItem);

            // Update display every 5 items or when complete for smoother updates
            if (apiGeocodedItems.length % 5 === 0 || i === needsAPIItems.length - 1) {
              setItemsWithCoords(prev => [...prev, ...apiGeocodedItems.splice(0)]);
            }
          }

          console.log('✅ All items geocoded and cached');
          setGeocodingProgress(null); // Clear progress indicator
        })();
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

  // Update marker icon when hover state changes
  useEffect(() => {
    filteredItems.forEach(item => {
      const marker = markerRefs.current.get(item.id);
      if (marker) {
        marker.setIcon(createPriceMarker(item.price, hoveredItemId === item.id || selectedItemId === item.id));
      }
    });
  }, [hoveredItemId, selectedItemId, filteredItems]);

  // Calculate center of map based on filtered items (default view)
  const defaultCenter: [number, number] = filteredItems.length > 0
    ? [
        filteredItems.reduce((sum, item) => sum + (item.latitude || 0), 0) / filteredItems.length,
        filteredItems.reduce((sum, item) => sum + (item.longitude || 0), 0) / filteredItems.length
      ]
    : [39.8283, -98.5795]; // Center of US

  // Create Zillow-style price marker
  const createPriceMarker = (price: number, isHighlighted = false) => {
    const priceText = price >= 1000 ? `$${(price / 1000).toFixed(1)}k` : `$${price}`;

    return L.divIcon({
      className: 'custom-price-marker',
      html: `
        <div style="
          background: ${isHighlighted ? '#0066ff' : '#ffffff'};
          color: ${isHighlighted ? '#ffffff' : '#000000'};
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 14px;
          border: 2px solid ${isHighlighted ? '#0066ff' : '#e0e0e0'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
          transform: ${isHighlighted ? 'scale(1.15)' : 'scale(1)'};
        ">
          ${priceText}
        </div>
      `,
      iconSize: [60, 32],
      iconAnchor: [30, 16],
      popupAnchor: [0, -16],
    });
  };

  // Handle listing card click - pan map to location
  const handleListingClick = (item: Item) => {
    if (item.latitude && item.longitude) {
      setMapCenter([item.latitude, item.longitude]);
      setMapZoom(15);
      setSelectedItemId(item.id);
      setPopupItem(item);
    }
  };

  // Handle popup click - navigate to item detail
  const handlePopupClick = (item: Item) => {
    navigate("/item-detail", { state: { item } });
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;

    // Only allow swiping left (negative offset)
    if (diff < 0) {
      const sidebarWidth = sidebarRef.current?.offsetWidth || 0;
      const maxSwipe = -sidebarWidth + 60; // Leave 60px visible as a handle
      setSidebarOffset(Math.max(maxSwipe, diff));
    } else if (sidebarOffset < 0) {
      // Allow swiping back right if already swiped
      setSidebarOffset(Math.min(0, sidebarOffset + diff));
      setTouchStartX(currentX);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    const sidebarWidth = sidebarRef.current?.offsetWidth || 0;
    const threshold = sidebarWidth * 0.3; // 30% swipe triggers close

    if (sidebarOffset < -threshold) {
      // Swipe was significant, close sidebar completely
      setSidebarOffset(-sidebarWidth);
    } else {
      // Swipe wasn't enough, snap back
      setSidebarOffset(0);
    }
  };

  return (
    <div className="h-full w-full flex flex-col relative bg-background">
      {/* Mobile Show/Hide List Button */}
      <div className="md:hidden flex-shrink-0 bg-background border-b border-border p-2">
        <Button
          onClick={() => {
            const sidebarWidth = sidebarRef.current?.offsetWidth || window.innerWidth * 0.75;
            if (sidebarOffset === 0) {
              // Hide list completely
              setSidebarOffset(-sidebarWidth);
            } else {
              // Show list
              setSidebarOffset(0);
            }
          }}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          {sidebarOffset === 0 ? (
            <>
              <ChevronLeft className="h-5 w-5" />
              Hide List
            </>
          ) : (
            <>
              <ChevronRight className="h-5 w-5" />
              Show List ({filteredItems.length})
            </>
          )}
        </Button>
      </div>

      {/* Main Content - Map and Sidebar */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Map Container - Full width, behind sidebar on mobile */}
        <div className="absolute inset-0 md:relative md:flex-1 h-full">
          <MapContainer
            center={defaultCenter}
            zoom={4}
            className="h-full w-full"
            style={{ zIndex: 0 }}
            scrollWheelZoom={true}
          >
            <MapUpdater center={mapCenter} zoom={mapZoom} triggerResize={sidebarOffset} />

            {/* Satellite imagery layer */}
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            {/* Labels overlay for streets and place names */}
            <TileLayer
              attribution=''
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />

            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={60}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              iconCreateFunction={(cluster) => {
                const count = cluster.getChildCount();
                return L.divIcon({
                  html: `<div style="
                    background: #0066ff;
                    color: white;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 16px;
                    box-shadow: 0 2px 8px rgba(0,102,255,0.4);
                    border: 3px solid white;
                  ">${count}</div>`,
                  className: 'custom-cluster-icon',
                  iconSize: L.point(40, 40, true),
                });
              }}
            >
              {filteredItems.map((item) => (
                <Marker
                  key={item.id}
                  position={[item.latitude!, item.longitude!]}
                  icon={createPriceMarker(item.price, hoveredItemId === item.id || selectedItemId === item.id)}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current.set(item.id, ref);
                    }
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedItemId(item.id);
                      setPopupItem(item);
                      setMapCenter([item.latitude!, item.longitude!]);
                      setMapZoom(15);
                    },
                    mouseover: () => {
                      setHoveredItemId(item.id);
                    },
                    mouseout: () => {
                      setHoveredItemId(null);
                    },
                  }}
                />
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>

        {/* Listing Cards Sidebar - Swipeable overlay on mobile, static on desktop */}
        <div
          ref={sidebarRef}
          className={`absolute md:relative w-[75%] sm:w-[240px] md:w-[280px] lg:w-[320px] h-full flex-shrink-0 overflow-y-auto bg-background border-r border-border md:translate-x-0 z-10 ${sidebarOffset === null ? 'md:opacity-100 opacity-0' : 'opacity-100'}`}
          style={{
            transform: window.innerWidth < 768 ? `translateX(${sidebarOffset ?? -window.innerWidth}px)` : 'translateX(0)',
            transition: isSwiping ? 'none' : 'transform 0.3s ease-out, opacity 0.2s ease-out'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
        {/* Swipe Indicator - Shows on mobile */}
        <div className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 w-1 h-20 bg-primary/30 rounded-l-full z-20 pointer-events-none">
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            <div className="w-1 h-1 rounded-full bg-primary/50"></div>
            <div className="w-1 h-1 rounded-full bg-primary/50"></div>
            <div className="w-1 h-1 rounded-full bg-primary/50"></div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
          {/* Prominent All Filters Button */}
          <Button
            onClick={() => navigate("/filters", { state: { fromMapView: true } })}
            className="w-full h-9 sm:h-12 md:h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-bold text-xs sm:text-base md:text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-1 sm:mr-2 md:mr-3" />
            <span className="hidden sm:inline">All Filters</span>
            <span className="sm:hidden">Filters</span>
          </Button>

          {/* Clear Filters Button */}
          <Button
            onClick={() => {
              setLocationSearch("");
              setPriceRange([0, maxPrice]);
              // Reset map view to default
              setMapZoom(4);
              setSelectedItemId(null);
              setHoveredItemId(null);
            }}
            variant="outline"
            className="w-full h-8 sm:h-10 md:h-12 border-2 border-primary/50 hover:bg-primary/10 font-semibold gap-1 sm:gap-2 transition-all text-xs sm:text-sm"
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Clear Filters</span>
            <span className="sm:hidden">Clear</span>
          </Button>

          {/* Listing Count */}
          <div className="text-center text-xs sm:text-sm text-muted-foreground pt-1 sm:pt-2 border-t border-border">
            Showing <span className="font-bold text-primary">{filteredItems.length}</span> listings
          </div>

          {/* Geocoding Progress */}
          {geocodingProgress && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">
                  Loading locations {geocodingProgress.current}/{geocodingProgress.total}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Listing Cards */}
        <div className="p-2 sm:p-3 md:p-2 space-y-2 sm:space-y-3 md:space-y-2">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`p-3 sm:p-4 md:p-3 cursor-pointer transition-all hover:shadow-lg border-2 ${
                selectedItemId === item.id
                  ? 'border-[#0066ff] shadow-lg'
                  : hoveredItemId === item.id
                  ? 'border-[#0066ff]/50'
                  : 'border-border'
              }`}
              onClick={() => handleListingClick(item)}
              onMouseEnter={() => setHoveredItemId(item.id)}
              onMouseLeave={() => setHoveredItemId(null)}
            >
              <div className="flex gap-3 sm:gap-4 md:gap-3">
                {/* Image */}
                {item.images && item.images.length > 0 && (
                  <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-xs sm:text-sm md:text-xs line-clamp-2">{item.title}</h3>
                  </div>
                  <p className="text-base sm:text-lg md:text-base font-bold text-[#0066ff] mb-1">
                    ${item.price.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm md:text-xs text-muted-foreground mb-1">{item.brand}</p>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 md:h-3 md:w-3 flex-shrink-0" />
                    <span className="text-xs sm:text-sm md:text-xs truncate">{item.location}</span>
                  </div>
                  <span className="inline-block mt-1 text-xs sm:text-sm md:text-xs bg-muted px-2 py-0.5 sm:py-1 md:py-0.5 rounded-full">
                    {item.condition}
                  </span>
                </div>
              </div>
            </Card>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items found</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setLocationSearch("");
                  setPriceRange([0, maxPrice]);
                  setMapZoom(4);
                  setSelectedItemId(null);
                  setHoveredItemId(null);
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
        </div>

        {/* Swipe Handle - Visible on mobile when sidebar is hidden */}
        {sidebarOffset < -10 && (
          <button
            onClick={() => setSidebarOffset(0)}
            className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-background/90 backdrop-blur-sm hover:bg-background border-2 border-border hover:border-primary/50 text-foreground rounded-r-lg px-2 py-4 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <div className="flex flex-col items-center gap-1">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-[9px] font-medium text-muted-foreground tracking-wide">
                LIST
              </div>
            </div>
          </button>
        )}

        {/* Listing Popup Preview - Shows when marker is clicked */}
        {popupItem && (
          <div className="fixed inset-x-0 bottom-0 md:absolute md:inset-auto md:bottom-4 md:left-1/2 md:-translate-x-1/2 z-50 max-w-md mx-auto px-4 pb-4 md:px-0">
            <Card
              className="bg-background/95 backdrop-blur-lg border-2 border-primary shadow-2xl overflow-hidden cursor-pointer"
              onClick={() => handlePopupClick(popupItem)}
            >
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPopupItem(null);
                  setSelectedItemId(null);
                }}
                className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background rounded-full p-1.5 shadow-lg transition-all"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex gap-4 p-4">
                {/* Image */}
                {popupItem.images && popupItem.images.length > 0 ? (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={popupItem.images[0]}
                      alt={popupItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : popupItem.videos && popupItem.videos.length > 0 ? (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <video
                      src={popupItem.videos[0]}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  </div>
                ) : null}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base mb-1 line-clamp-2">{popupItem.title}</h3>
                  <p className="text-xl font-bold text-primary mb-1">
                    ${popupItem.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">{popupItem.brand}</p>
                  <div className="flex items-center gap-1 text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs truncate">{popupItem.location}</span>
                  </div>
                  <span className="inline-block text-xs bg-muted px-2 py-1 rounded-full">
                    {popupItem.condition}
                  </span>
                </div>
              </div>

              {/* Click to view full listing hint */}
              <div className="px-4 pb-3 pt-0">
                <div className="text-center text-xs text-muted-foreground bg-muted/50 py-2 rounded-lg">
                  Click to view full listing
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
