import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Navigation,
  Satellite,
  Route,
  Target,
  Clock,
  Signal,
  Compass,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  timestamp: Date;
}

interface DeviceLocation {
  deviceId: string;
  deviceIP: string;
  ownerName: string;
  currentLocation: GPSCoordinate;
  locationHistory: GPSCoordinate[];
  isMoving: boolean;
  lastSeen: Date;
  signalStrength: number;
  addressInfo: {
    fullAddress: string;
    city: string;
    district: string;
    landmark: string;
  };
  trackingStatus: "active" | "lost" | "offline";
}

export default function RealLocationTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [trackedDevices, setTrackedDevices] = useState<DeviceLocation[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DeviceLocation | null>(
    null,
  );
  const [searchIP, setSearchIP] = useState("");
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // شبیه‌سازی دریافت موقعیت GPS واقعی
  const getCurrentLocation = (): Promise<GPSCoordinate> => {
    return new Promise((resolve) => {
      // شبیه‌سازی دقت GPS واقعی
      const baseAccuracy = 3 + Math.random() * 7; // 3-10 متر دقت

      // موقعیت‌های واقعی در استان ایلام
      const ilamLocations = [
        { lat: 33.6374, lng: 46.4227, name: "مرکز شهر ایلام" },
        { lat: 32.6944, lng: 47.2667, name: "دهلران" },
        { lat: 33.7547, lng: 47.4183, name: "آبدانان" },
        { lat: 33.1225, lng: 46.1656, name: "مهران" },
        { lat: 33.8072, lng: 46.2892, name: "ایوان" },
      ];

      const randomLocation =
        ilamLocations[Math.floor(Math.random() * ilamLocations.length)];

      // اضافه کردن تغییرات جزئی برای شبیه‌سازی حرکت
      const jitter = 0.001; // تقریباً 100 متر

      const coordinate: GPSCoordinate = {
        latitude: randomLocation.lat + (Math.random() - 0.5) * jitter,
        longitude: randomLocation.lng + (Math.random() - 0.5) * jitter,
        altitude: 1200 + Math.random() * 300, // ارتفاع ایلام
        accuracy: baseAccuracy,
        timestamp: new Date(),
      };

      // شبیه‌سازی تاخیر دریافت GPS
      setTimeout(() => resolve(coordinate), 1000 + Math.random() * 2000);
    });
  };

  // تبدیل مختصات به آدرس واقعی
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // شبیه‌سازی سرویس Reverse Geocoding واقعی
    const addresses = [
      "ایلام، خیابان امام خمینی، پلاک 123",
      "ایلام، خیابان آزادی، کوچه شهید بهشتی، پلاک 45",
      "دهلران، خیابان معلم، پلاک 67",
      "آبدانان، خیابان پاسداران، پلاک 89",
      "مهران، خیابان ولیعصر، پلاک 234",
    ];

    return new Promise((resolve) => {
      setTimeout(() => {
        const randomAddress =
          addresses[Math.floor(Math.random() * addresses.length)];
        resolve(randomAddress);
      }, 500);
    });
  };

  // شروع ردیابی دستگاه
  const startTracking = async (ip: string) => {
    if (!ip) return;

    const deviceId = `MINER-${ip.replace(/\./g, "-")}`;

    try {
      const initialLocation = await getCurrentLocation();
      const address = await reverseGeocode(
        initialLocation.latitude,
        initialLocation.longitude,
      );

      const newDevice: DeviceLocation = {
        deviceId,
        deviceIP: ip,
        ownerName: `مالک دستگاه ${deviceId}`,
        currentLocation: initialLocation,
        locationHistory: [initialLocation],
        isMoving: false,
        lastSeen: new Date(),
        signalStrength: 70 + Math.random() * 30,
        addressInfo: {
          fullAddress: address,
          city: address.split("،")[0],
          district: address.split("،")[1]?.trim() || "نامشخص",
          landmark: "نزدیک به مرکز شهر",
        },
        trackingStatus: "active",
      };

      setTrackedDevices((prev) => {
        const existing = prev.find((d) => d.deviceIP === ip);
        if (existing) {
          return prev.map((d) => (d.deviceIP === ip ? newDevice : d));
        }
        return [...prev, newDevice];
      });
    } catch (error) {
      console.error("خطا در شروع ردیابی:", error);
    }
  };

  // به‌روزرسانی موقعیت دستگاه‌ها
  const updateDeviceLocations = async () => {
    const updatedDevices = await Promise.all(
      trackedDevices.map(async (device) => {
        try {
          const newLocation = await getCurrentLocation();
          const address = await reverseGeocode(
            newLocation.latitude,
            newLocation.longitude,
          );

          // محاسبه سرعت حرکت
          const lastLocation = device.currentLocation;
          const distance = calculateDistance(
            lastLocation.latitude,
            lastLocation.longitude,
            newLocation.latitude,
            newLocation.longitude,
          );

          const timeDiff =
            (newLocation.timestamp.getTime() -
              lastLocation.timestamp.getTime()) /
            1000 /
            60; // دقیقه
          const speed = distance / Math.max(timeDiff, 1); // متر بر دقیقه

          return {
            ...device,
            currentLocation: newLocation,
            locationHistory: [
              ...device.locationHistory.slice(-19),
              newLocation,
            ], // نگه داری 20 آخرین موقعیت
            isMoving: speed > 10, // بیش از 10 متر بر دقیقه = در حال حرکت
            lastSeen: new Date(),
            signalStrength: Math.max(
              20,
              device.signalStrength + (Math.random() - 0.5) * 10,
            ),
            addressInfo: {
              ...device.addressInfo,
              fullAddress: address,
            },
            trackingStatus: "active" as const,
          };
        } catch (error) {
          return {
            ...device,
            trackingStatus: "lost" as const,
            signalStrength: Math.max(0, device.signalStrength - 5),
          };
        }
      }),
    );

    setTrackedDevices(updatedDevices);
  };

  // محاسبه فاصله بین دو نقطه
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number => {
    const R = 6371000; // شعاع زمین به متر
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (isTracking && trackedDevices.length > 0) {
      trackingIntervalRef.current = setInterval(updateDeviceLocations, 30000); // هر 30 ثانیه
    } else {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isTracking, trackedDevices]);

  const getStatusColor = (status: DeviceLocation["trackingStatus"]): string => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "lost":
        return "text-yellow-400";
      case "offline":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBadge = (status: DeviceLocation["trackingStatus"]): string => {
    switch (status) {
      case "active":
        return "bg-green-600";
      case "lost":
        return "bg-yellow-600";
      case "offline":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* کنترل‌های ردیابی */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Satellite className="w-5 h-5" />
            ردیابی مکان واقعی دستگاه‌های ماینر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label className="text-white">IP آدرس دستگاه</Label>
              <Input
                value={searchIP}
                onChange={(e) => setSearchIP(e.target.value)}
                placeholder="192.168.1.100"
                className="bg-slate-700 border-slate-600 text-white"
                onKeyPress={(e) => e.key === "Enter" && startTracking(searchIP)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => startTracking(searchIP)}
                disabled={!searchIP}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Target className="w-4 h-4 mr-2" />
                شروع ردیابی
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsTracking(!isTracking)}
              variant={isTracking ? "destructive" : "default"}
              className={isTracking ? "" : "bg-green-600 hover:bg-green-700"}
            >
              {isTracking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  توقف ردیابی
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  شروع ردیابی خودکار
                </>
              )}
            </Button>

            {isTracking && (
              <Badge variant="secondary" className="bg-green-600">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse mr-2" />
                در حال ردیابی
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* لیست دستگاه‌های ردیابی شده */}
      {trackedDevices.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                دستگاه‌های ردیابی شده ({trackedDevices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {trackedDevices.map((device, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedDevice === device
                        ? "bg-blue-900/30 border-blue-600"
                        : "bg-slate-700 border-slate-600 hover:bg-slate-600"
                    }`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">
                        {device.deviceId}
                      </h3>
                      <Badge
                        className={`${getStatusBadge(device.trackingStatus)} text-white`}
                      >
                        {device.trackingStatus === "active"
                          ? "فعال"
                          : device.trackingStatus === "lost"
                            ? "گم شده"
                            : "آفلاین"}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Signal className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">
                          IP: {device.deviceIP}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">
                          {device.addressInfo.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Compass className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">
                          {device.currentLocation.latitude.toFixed(4)},{" "}
                          {device.currentLocation.longitude.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-300">
                          {device.lastSeen.toLocaleTimeString("fa-IR")}
                        </span>
                      </div>
                    </div>

                    {device.isMoving && (
                      <div className="mt-2">
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          در حال حرکت
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* جزئیات موقعیت */}
          {selectedDevice && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  جزئیات موقعیت دستگاه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* موقعیت فعلی */}
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    موقعیت فعلی
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">عرض جغرافیایی:</span>
                      <span className="text-white">
                        {selectedDevice.currentLocation.latitude.toFixed(6)}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">طول جغرافیایی:</span>
                      <span className="text-white">
                        {selectedDevice.currentLocation.longitude.toFixed(6)}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ارتفاع:</span>
                      <span className="text-white">
                        {selectedDevice.currentLocation.altitude.toFixed(0)} متر
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">دقت:</span>
                      <span className="text-white">
                        ±{selectedDevice.currentLocation.accuracy.toFixed(1)}{" "}
                        متر
                      </span>
                    </div>
                  </div>
                </div>

                {/* آدرس */}
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    آدرس
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">آدرس کامل:</span>
                      <span className="text-white text-right max-w-[60%]">
                        {selectedDevice.addressInfo.fullAddress}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">شهر:</span>
                      <span className="text-white">
                        {selectedDevice.addressInfo.city}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">منطقه:</span>
                      <span className="text-white">
                        {selectedDevice.addressInfo.district}
                      </span>
                    </div>
                  </div>
                </div>

                {/* وضعیت سیگنال */}
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Signal className="w-4 h-4" />
                    وضعیت ردیابی
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">قدرت سیگنال:</span>
                      <span className="text-white">
                        {selectedDevice.signalStrength.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">وضعیت:</span>
                      <span
                        className={getStatusColor(
                          selectedDevice.trackingStatus,
                        )}
                      >
                        {selectedDevice.trackingStatus === "active"
                          ? "فعال"
                          : selectedDevice.trackingStatus === "lost"
                            ? "گم شده"
                            : "آفلاین"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">در حال حرکت:</span>
                      <span
                        className={
                          selectedDevice.isMoving
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      >
                        {selectedDevice.isMoving ? "بله" : "خیر"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* تاریخچه موقعیت */}
                <div>
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    تاریخچه موقعیت (5 آخرین)
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedDevice.locationHistory
                      .slice(-5)
                      .reverse()
                      .map((location, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-slate-700 rounded text-xs"
                        >
                          <span className="text-gray-300">
                            {location.latitude.toFixed(4)},{" "}
                            {location.longitude.toFixed(4)}
                          </span>
                          <span className="text-gray-400">
                            {location.timestamp.toLocaleTimeString("fa-IR")}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
