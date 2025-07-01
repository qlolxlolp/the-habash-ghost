import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { DetectedMiner } from '@/lib/types';
import { 
  ILAM_BOUNDS, 
  ILAM_CITIES, 
  getThreatLevelColor, 
  getDeviceTypeIcon,
  formatHashRate,
  formatPowerConsumption,
  formatConfidenceScore 
} from '@/lib/mapUtils';

interface InteractiveMapProps {
  miners?: DetectedMiner[];
}

export default function InteractiveMap({ miners = [] }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedMiner, setSelectedMiner] = useState<DetectedMiner | null>(null);

  useEffect(() => {
    // Dynamically load Leaflet
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;

      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || !(window as any).L) return;

      const L = (window as any).L;

      // Initialize map centered on Ilam province
      leafletMapRef.current = L.map(mapRef.current, {
        center: ILAM_BOUNDS.center,
        zoom: 9,
        zoomControl: false,
        attributionControl: false
      });

      // Add tile layer with dark theme
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(leafletMapRef.current);

      // Add Ilam province boundary
      const ilamBoundary = [
        [ILAM_BOUNDS.north, ILAM_BOUNDS.west],
        [ILAM_BOUNDS.north, ILAM_BOUNDS.east],
        [ILAM_BOUNDS.south, ILAM_BOUNDS.east],
        [ILAM_BOUNDS.south, ILAM_BOUNDS.west],
        [ILAM_BOUNDS.north, ILAM_BOUNDS.west]
      ];

      L.polyline(ilamBoundary, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 10'
      }).addTo(leafletMapRef.current);

      // Add city markers
      Object.entries(ILAM_CITIES).forEach(([cityName, [lat, lon]]) => {
        const cityMarker = L.circleMarker([lat, lon], {
          radius: 6,
          fillColor: '#60a5fa',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(leafletMapRef.current);

        cityMarker.bindTooltip(cityName, {
          permanent: false,
          direction: 'top',
          className: 'city-tooltip'
        });
      });

      // Add custom zoom controls
      L.control.zoom({
        position: 'bottomleft'
      }).addTo(leafletMapRef.current);

      setMapLoaded(true);
    };

    loadLeaflet();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      leafletMapRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add miner markers
    miners.forEach((miner) => {
      if (miner.latitude && miner.longitude) {
        const color = getThreatLevelColor(miner.threatLevel);
        const icon = getDeviceTypeIcon(miner.deviceType || '');

        // Create custom icon
        const minerIcon = L.divIcon({
          html: `
            <div class="miner-marker" style="background-color: ${color}">
              <span class="miner-icon">${icon}</span>
              ${miner.threatLevel === 'high' ? '<div class="pulse-ring"></div>' : ''}
            </div>
          `,
          className: 'custom-div-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([miner.latitude, miner.longitude], {
          icon: minerIcon
        }).addTo(leafletMapRef.current);

        // Create popup content
        const popupContent = `
          <div class="miner-popup" dir="rtl">
            <div class="popup-header">
              <h3>${miner.ipAddress}</h3>
              <span class="threat-badge threat-${miner.threatLevel}">${
                miner.threatLevel === 'high' ? 'بحرانی' :
                miner.threatLevel === 'medium' ? 'مشکوک' : 'عادی'
              }</span>
            </div>
            <div class="popup-content">
              <p><strong>نوع دستگاه:</strong> ${miner.deviceType || 'نامشخص'}</p>
              <p><strong>شهر:</strong> ${miner.city || 'نامشخص'}</p>
              <p><strong>امتیاز شک:</strong> ${formatConfidenceScore(miner.confidenceScore)}</p>
              ${miner.hashRate ? `<p><strong>نرخ هش:</strong> ${formatHashRate(miner.hashRate)}</p>` : ''}
              ${miner.powerConsumption ? `<p><strong>مصرف برق:</strong> ${formatPowerConsumption(miner.powerConsumption)}</p>` : ''}
              <p><strong>زمان شناسایی:</strong> ${new Date(miner.detectionTime).toLocaleString('fa-IR')}</p>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup'
        });

        marker.on('click', () => {
          setSelectedMiner(miner);
        });

        markersRef.current.push(marker);
      }
    });

    // Add custom CSS for markers and popups
    if (!document.querySelector('#map-styles')) {
      const style = document.createElement('style');
      style.id = 'map-styles';
      style.textContent = `
        .custom-div-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .miner-marker {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .miner-icon {
          font-size: 12px;
          color: white;
        }
        
        .pulse-ring {
          content: '';
          width: 35px;
          height: 35px;
          border: 2px solid #ef4444;
          border-radius: 50%;
          position: absolute;
          top: -7px;
          left: -7px;
          animation: pulse 2s infinite;
          opacity: 0.6;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          background: #1f2937;
          color: white;
          border-radius: 8px;
          border: 1px solid #374151;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 12px;
          font-family: 'Vazirmatn', sans-serif;
        }
        
        .miner-popup {
          min-width: 250px;
        }
        
        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #374151;
        }
        
        .popup-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: bold;
        }
        
        .threat-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
        }
        
        .threat-high {
          background: #ef4444;
          color: white;
        }
        
        .threat-medium {
          background: #f59e0b;
          color: white;
        }
        
        .threat-low {
          background: #10b981;
          color: white;
        }
        
        .popup-content p {
          margin: 4px 0;
          font-size: 13px;
        }
        
        .city-tooltip {
          background: rgba(59, 130, 246, 0.9);
          color: white;
          border: none;
          border-radius: 4px;
          font-family: 'Vazirmatn', sans-serif;
          font-size: 12px;
        }
      `;
      document.head.appendChild(style);
    }

  }, [miners, mapLoaded]);

  const handleRefresh = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView(ILAM_BOUNDS.center, 9);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 100);
  };

  const confirmedMiners = miners.filter(m => m.threatLevel === 'high').length;
  const suspiciousDevices = miners.filter(m => m.threatLevel === 'medium').length;
  const normalDevices = miners.filter(m => m.threatLevel === 'low').length;

  return (
    <Card className={`persian-card mb-6 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-lg">
            <Map className="ml-2 h-5 w-5 text-primary" />
            نقشه توزیع ماینرها - استان ایلام
          </CardTitle>
          <div className="flex space-x-reverse space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="focus-ring"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="focus-ring"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`map-container ${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-96'} relative overflow-hidden rounded-lg`}>
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Map Legend */}
          <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg backdrop-blur-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-3 h-3 bg-persian-error rounded-full"></div>
                <span>ماینر تأیید شده ({confirmedMiners})</span>
              </div>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-3 h-3 bg-persian-warning rounded-full"></div>
                <span>مشکوک ({suspiciousDevices})</span>
              </div>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-3 h-3 bg-persian-success rounded-full"></div>
                <span>عادی ({normalDevices})</span>
              </div>
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span>شهرها</span>
              </div>
            </div>
          </div>

          {/* Loading Overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 bg-persian-surface/80 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                <p className="text-muted-foreground">در حال بارگذاری نقشه...</p>
              </div>
            </div>
          )}
        </div>

        {/* Selected Miner Info */}
        {selectedMiner && (
          <div className="mt-4 p-4 bg-persian-surface-variant rounded-lg border border-border">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-foreground">اطلاعات دستگاه انتخابی</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMiner(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">IP:</span>
                <span className="mr-2 font-medium">{selectedMiner.ipAddress}</span>
              </div>
              <div>
                <span className="text-muted-foreground">امتیاز شک:</span>
                <span className="mr-2 font-medium">{formatConfidenceScore(selectedMiner.confidenceScore)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">نوع:</span>
                <span className="mr-2 font-medium">{selectedMiner.deviceType || 'نامشخص'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">شهر:</span>
                <span className="mr-2 font-medium">{selectedMiner.city || 'نامشخص'}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
