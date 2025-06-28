import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline, Circle } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Navigation, 
  MapPin, 
  Crosshair, 
  Route, 
  Satellite, 
  Map as MapIcon,
  Search,
  Layers,
  Target,
  Radio,
  Shield,
  AlertTriangle
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DetectedMiner } from '@/lib/types';
import { iranProvinces } from '@shared/iranData';

// Real Iranian map tile servers
const MAP_SOURCES = {
  osm: {
    name: 'نقشه استاندارد',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  satellite: {
    name: 'تصاویر ماهواره‌ای',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri WorldImagery'
  },
  terrain: {
    name: 'نقشه توپوگرافی',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap contributors'
  },
  iran: {
    name: 'نقشه ایران',
    url: 'https://map.ir/shiveh/{z}/{x}/{y}.png',
    attribution: '© نقشه ایران'
  }
};

// Custom icons for different miner types
const createMinerIcon = (threatLevel: string, isActive: boolean) => {
  const color = threatLevel === 'high' ? '#ef4444' : 
               threatLevel === 'medium' ? '#f59e0b' : '#10b981';
  
  return L.divIcon({
    html: `
      <div style="
        width: 24px; 
        height: 24px; 
        background: ${color}; 
        border: 2px solid white; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${isActive ? 'animation: pulse 2s infinite;' : ''}
      ">
        <div style="
          width: 8px; 
          height: 8px; 
          background: white; 
          border-radius: 50%;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      </style>
    `,
    className: 'custom-miner-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// User location tracking component
function LocationTracker({ onLocationUpdate }: { onLocationUpdate: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationUpdate(latitude, longitude);
        },
        (error) => {
          console.error('خطا در دریافت موقعیت:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [onLocationUpdate]);

  return null;
}

// Map click handler for adding waypoints
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Route calculator component
function RouteCalculator({ start, end, onRouteCalculated }: { 
  start: [number, number] | null; 
  end: [number, number] | null;
  onRouteCalculated: (route: [number, number][]) => void;
}) {
  useEffect(() => {
    if (start && end) {
      // Use real routing service (OSRM for Iran)
      const calculateRoute = async () => {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          
          if (data.routes && data.routes[0]) {
            const coordinates = data.routes[0].geometry.coordinates.map(
              (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
            );
            onRouteCalculated(coordinates);
          }
        } catch (error) {
          console.error('خطا در محاسبه مسیر:', error);
          // Fallback to straight line
          onRouteCalculated([start, end]);
        }
      };

      calculateRoute();
    }
  }, [start, end, onRouteCalculated]);

  return null;
}

interface LiveMapProps {
  miners: DetectedMiner[];
  selectedProvince?: string;
  selectedCity?: string;
  onMinerSelect?: (miner: DetectedMiner) => void;
}

export default function LiveMap({ miners, selectedProvince, selectedCity, onMinerSelect }: LiveMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapSource, setMapSource] = useState<keyof typeof MAP_SOURCES>('osm');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const mapRef = useRef<L.Map>(null);

  // Default center to Ilam province
  const defaultCenter: [number, number] = [33.6374, 46.4227];
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(8);

  // Update map center based on selected province/city
  useEffect(() => {
    if (selectedCity) {
      const province = iranProvinces.find(p => p.name === selectedProvince);
      const city = province?.cities.find(c => c.name === selectedCity);
      if (city) {
        setMapCenter([city.latitude, city.longitude]);
        setMapZoom(12);
      }
    } else if (selectedProvince) {
      const province = iranProvinces.find(p => p.name === selectedProvince);
      if (province) {
        setMapCenter([province.latitude, province.longitude]);
        setMapZoom(9);
      }
    }
  }, [selectedProvince, selectedCity]);

  // Real-time search using Nominatim geocoding for Iran
  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ir&limit=5`
      );
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('خطا در جستجو:', error);
      setSearchResults([]);
    }
  };

  // Navigate to search result
  const navigateToResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setMapCenter([lat, lon]);
    setMapZoom(15);
    setSearchResults([]);
    setSearchQuery(result.display_name);
  };

  // Get user location
  const getCurrentLocation = () => {
    setIsTracking(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setMapZoom(15);
          setIsTracking(false);
        },
        (error) => {
          console.error('خطا در دریافت موقعیت:', error);
          setIsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Add waypoint for routing
  const handleMapClick = (lat: number, lng: number) => {
    if (showRoute) {
      const newWaypoint: [number, number] = [lat, lng];
      setWaypoints(prev => [...prev, newWaypoint]);
    }
  };

  // Calculate route between waypoints
  const calculateCompleteRoute = () => {
    if (waypoints.length >= 2) {
      // Calculate route from first to last waypoint
      const start = waypoints[0];
      const end = waypoints[waypoints.length - 1];
      // RouteCalculator component will handle this
    }
  };

  // Clear route and waypoints
  const clearRoute = () => {
    setWaypoints([]);
    setRoute([]);
  };

  // Focus on specific province
  const focusOnProvince = (provinceName: string) => {
    const province = iranProvinces.find(p => p.name === provinceName);
    if (province) {
      setMapCenter([province.latitude, province.longitude]);
      setMapZoom(9);
    }
  };

  // Filter miners based on map bounds
  const getVisibleMiners = () => {
    if (!mapRef.current) return miners;
    
    const bounds = mapRef.current.getBounds();
    return miners.filter(miner => {
      if (!miner.latitude || !miner.longitude) return false;
      return bounds.contains([miner.latitude, miner.longitude]);
    });
  };

  return (
    <Card className="persian-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <MapIcon className="ml-2 h-5 w-5 text-primary" />
            نقشه زنده و هوشمند
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <Badge variant="outline" className="persian-numbers">
              {miners.length} دستگاه شناسایی شده
            </Badge>
            {userLocation && (
              <Badge variant="secondary">
                موقعیت شما شناسایی شد
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Map Controls */}
        <div className="p-4 border-b border-border space-y-4">
          {/* Search and Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Search */}
            <div className="relative">
              <Label className="text-sm font-medium">جستجوی مکان</Label>
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="نام شهر، خیابان یا نقطه مورد نظر"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="pr-10 focus-ring"
                />
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => navigateToResult(result)}
                      className="w-full p-3 text-right hover:bg-persian-surface-variant transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="font-medium text-sm">{result.display_name}</div>
                      <div className="text-xs text-muted-foreground persian-numbers">
                        {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map Style Selector */}
            <div>
              <Label className="text-sm font-medium">نوع نقشه</Label>
              <select
                value={mapSource}
                onChange={(e) => setMapSource(e.target.value as keyof typeof MAP_SOURCES)}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground focus-ring"
              >
                {Object.entries(MAP_SOURCES).map(([key, source]) => (
                  <option key={key} value={key}>{source.name}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={getCurrentLocation}
                disabled={isTracking}
                variant="outline"
                size="sm"
                className="focus-ring"
              >
                <Crosshair className="h-4 w-4 ml-1" />
                {isTracking ? 'در حال تعیین موقعیت...' : 'موقعیت من'}
              </Button>
              
              <Button
                onClick={() => setShowRoute(!showRoute)}
                variant={showRoute ? "default" : "outline"}
                size="sm"
                className="focus-ring"
              >
                <Route className="h-4 w-4 ml-1" />
                مسیریابی
              </Button>

              {showRoute && (
                <Button
                  onClick={clearRoute}
                  variant="outline"
                  size="sm"
                  className="focus-ring"
                >
                  پاک کردن مسیر
                </Button>
              )}
            </div>
          </div>

          {/* Province Quick Access */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">دسترسی سریع:</span>
            {iranProvinces.slice(0, 5).map((province) => (
              <Button
                key={province.id}
                onClick={() => focusOnProvince(province.name)}
                variant="ghost"
                size="sm"
                className="text-xs focus-ring"
              >
                {province.name}
              </Button>
            ))}
          </div>

          {/* Route Info */}
          {showRoute && waypoints.length > 0 && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center space-x-reverse space-x-2 mb-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">نقاط مسیر</span>
              </div>
              <div className="text-xs space-y-1">
                {waypoints.map((point, index) => (
                  <div key={index} className="persian-numbers">
                    نقطه {index + 1}: {point[0].toFixed(4)}, {point[1].toFixed(4)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="relative h-96 lg:h-[500px]">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              url={MAP_SOURCES[mapSource].url}
              attribution={MAP_SOURCES[mapSource].attribution}
            />

            {/* Location Tracker */}
            <LocationTracker onLocationUpdate={setUserLocation} />

            {/* Map Click Handler for Routing */}
            {showRoute && <MapClickHandler onMapClick={handleMapClick} />}

            {/* Route Calculator */}
            {waypoints.length >= 2 && (
              <RouteCalculator
                start={waypoints[0]}
                end={waypoints[waypoints.length - 1]}
                onRouteCalculated={setRoute}
              />
            )}

            {/* User Location Marker */}
            {userLocation && (
              <Marker
                position={userLocation}
                icon={L.divIcon({
                  html: `
                    <div style="
                      width: 20px; 
                      height: 20px; 
                      background: #3b82f6; 
                      border: 3px solid white; 
                      border-radius: 50%; 
                      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      animation: userPulse 2s infinite;
                    "></div>
                    <style>
                      @keyframes userPulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.3); }
                      }
                    </style>
                  `,
                  className: 'user-location-icon',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>
                  <div className="text-center">
                    <strong>موقعیت شما</strong>
                    <div className="text-xs persian-numbers">
                      {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Miner Markers */}
            {miners.map((miner) => {
              if (!miner.latitude || !miner.longitude) return null;
              
              return (
                <Marker
                  key={miner.id}
                  position={[miner.latitude, miner.longitude]}
                  icon={createMinerIcon(miner.threatLevel, miner.isActive)}
                  eventHandlers={{
                    click: () => onMinerSelect?.(miner)
                  }}
                >
                  <Popup>
                    <div className="min-w-48">
                      <div className="flex items-center justify-between mb-2">
                        <strong className="persian-numbers">دستگاه #{miner.id}</strong>
                        <Badge 
                          variant={miner.threatLevel === 'high' ? 'destructive' : 
                                  miner.threatLevel === 'medium' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {miner.threatLevel === 'high' ? 'خطر بالا' :
                           miner.threatLevel === 'medium' ? 'مشکوک' : 'امن'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div><strong>IP:</strong> <span className="persian-numbers">{miner.ipAddress}</span></div>
                        {miner.hostname && <div><strong>نام:</strong> {miner.hostname}</div>}
                        {miner.city && <div><strong>شهر:</strong> {miner.city}</div>}
                        <div><strong>روش شناسایی:</strong> {miner.detectionMethod}</div>
                        <div><strong>امتیاز اطمینان:</strong> <span className="persian-numbers">{miner.confidenceScore}%</span></div>
                        {miner.powerConsumption && (
                          <div><strong>مصرف برق:</strong> <span className="persian-numbers">{miner.powerConsumption}</span> وات</div>
                        )}
                        <div className="text-muted-foreground persian-numbers">
                          {new Date(miner.detectionTime).toLocaleString('fa-IR')}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Waypoint Markers */}
            {waypoints.map((point, index) => (
              <Marker
                key={`waypoint-${index}`}
                position={point}
                icon={L.divIcon({
                  html: `
                    <div style="
                      width: 16px; 
                      height: 16px; 
                      background: #f59e0b; 
                      border: 2px solid white; 
                      border-radius: 50%; 
                      display: flex; 
                      align-items: center; 
                      justify-content: center;
                      font-size: 10px;
                      font-weight: bold;
                      color: white;
                    ">${index + 1}</div>
                  `,
                  className: 'waypoint-icon',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              >
                <Popup>
                  <div className="text-center">
                    <strong>نقطه {index + 1}</strong>
                    <div className="text-xs persian-numbers">
                      {point[0].toFixed(4)}, {point[1].toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Route Polyline */}
            {route.length > 0 && (
              <Polyline
                positions={route}
                color="#3b82f6"
                weight={4}
                opacity={0.7}
              />
            )}

            {/* Province Boundaries (for selected province) */}
            {selectedProvince && (
              (() => {
                const province = iranProvinces.find(p => p.name === selectedProvince);
                if (province) {
                  return (
                    <Circle
                      center={[province.latitude, province.longitude]}
                      radius={Math.sqrt(province.area) * 500} // Approximate radius
                      fillColor="blue"
                      fillOpacity={0.1}
                      color="blue"
                      weight={2}
                      opacity={0.5}
                    />
                  );
                }
                return null;
              })()
            )}
          </MapContainer>

          {/* Map Legend */}
          <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur border border-border rounded-lg p-3 text-xs">
            <div className="font-medium mb-2">راهنما</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>خطر بالا</span>
              </div>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>مشکوک</span>
              </div>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>امن</span>
              </div>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>موقعیت شما</span>
              </div>
            </div>
          </div>

          {/* Loading overlay */}
          {isTracking && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur flex items-center justify-center">
              <div className="text-center">
                <Target className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">در حال تعیین موقعیت...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}