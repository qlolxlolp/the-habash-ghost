// Map utilities for handling Iranian coordinates and geolocation

export interface IranProvince {
  name: string;
  nameEn: string;
  center: [number, number]; // [lat, lng]
  cities: string[];
}

export interface DetectedDevice {
  id: string;
  ip: string;
  location: [number, number]; // [lat, lng]
  province: string;
  city: string;
  confidence: number;
  powerConsumption: number;
  lastSeen: string;
  status: "active" | "inactive" | "suspicious";
}

// Ilam Province boundaries and cities
export const ILAM_PROVINCE: IranProvince = {
  name: "ایلام",
  nameEn: "Ilam",
  center: [33.6374, 46.4227],
  cities: [
    "ایلام",
    "دهلران",
    "آبدانان",
    "دره شهر",
    "ایوان",
    "شیروان چرداول",
    "مهران",
    "بدره",
    "ملکشاهی",
    "چوار",
    "سرابله",
    "هلیلان",
  ],
};

// Iran provinces data
export const IRAN_PROVINCES: IranProvince[] = [
  ILAM_PROVINCE,
  {
    name: "تهران",
    nameEn: "Tehran",
    center: [35.6892, 51.389],
    cities: ["تهران", "کرج", "شهریار", "ورامین", "پاکدشت"],
  },
  {
    name: "اصفهان",
    nameEn: "Isfahan",
    center: [32.6546, 51.668],
    cities: ["اصفهان", "کاشان", "نجف آباد", "خمینی شهر"],
  },
  // Add more provinces as needed
];

// Utility functions
export function isWithinIlam(lat: number, lng: number): boolean {
  // Simple bounding box check for Ilam province
  const ilamBounds = {
    north: 34.2,
    south: 32.8,
    east: 47.8,
    west: 45.4,
  };

  return (
    lat >= ilamBounds.south &&
    lat <= ilamBounds.north &&
    lng >= ilamBounds.west &&
    lng <= ilamBounds.east
  );
}

export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
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
}

export function findNearestCity(lat: number, lng: number): string {
  const cities = [
    { name: "ایلام", coords: [33.6374, 46.4227] },
    { name: "دهلران", coords: [32.6944, 47.2667] },
    { name: "آبدانان", coords: [33.7547, 47.4183] },
    { name: "مهران", coords: [33.1225, 46.1656] },
  ];

  let nearest = cities[0];
  let minDistance = getDistanceKm(
    lat,
    lng,
    nearest.coords[0],
    nearest.coords[1],
  );

  cities.forEach((city) => {
    const distance = getDistanceKm(lat, lng, city.coords[0], city.coords[1]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  });

  return nearest.name;
}

export function generateMockDevices(count: number = 20): DetectedDevice[] {
  const devices: DetectedDevice[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random coordinates within Ilam province bounds
    const lat = 32.8 + Math.random() * (34.2 - 32.8);
    const lng = 45.4 + Math.random() * (47.8 - 45.4);

    devices.push({
      id: `device-${i + 1}`,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      location: [lat, lng],
      province: "ایلام",
      city: findNearestCity(lat, lng),
      confidence: 0.7 + Math.random() * 0.3,
      powerConsumption: 10 + Math.random() * 40,
      lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      status:
        Math.random() > 0.8
          ? "suspicious"
          : Math.random() > 0.1
            ? "active"
            : "inactive",
    });
  }

  return devices;
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}

export function getDeviceStatusColor(status: DetectedDevice["status"]): string {
  switch (status) {
    case "active":
      return "text-green-400";
    case "suspicious":
      return "text-red-400";
    case "inactive":
      return "text-gray-400";
    default:
      return "text-gray-400";
  }
}

export function getDeviceStatusBadge(status: DetectedDevice["status"]): string {
  switch (status) {
    case "active":
      return "bg-green-600";
    case "suspicious":
      return "bg-red-600";
    case "inactive":
      return "bg-gray-600";
    default:
      return "bg-gray-600";
  }
}
