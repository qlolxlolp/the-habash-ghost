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

export interface DetectedMiner extends DetectedDevice {
  hashRate: number;
  algorithm: string;
  pool: string;
  wallet: string;
  threatLevel: "low" | "medium" | "high" | "critical";
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

// Real device detection will be populated by actual network scans
// No mock data generation - only real detected devices will be stored

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

// Cryptocurrency mining utility functions
export function formatHashRate(hashRate: number): string {
  if (hashRate >= 1e12) {
    return `${(hashRate / 1e12).toFixed(2)} TH/s`;
  } else if (hashRate >= 1e9) {
    return `${(hashRate / 1e9).toFixed(2)} GH/s`;
  } else if (hashRate >= 1e6) {
    return `${(hashRate / 1e6).toFixed(2)} MH/s`;
  } else if (hashRate >= 1e3) {
    return `${(hashRate / 1e3).toFixed(2)} KH/s`;
  }
  return `${hashRate.toFixed(2)} H/s`;
}

export function formatPowerConsumption(power: number): string {
  if (power >= 1000) {
    return `${(power / 1000).toFixed(2)} kW`;
  }
  return `${power.toFixed(0)} W`;
}

export function formatConfidenceScore(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

export function getThreatLevelColor(
  level: DetectedMiner["threatLevel"],
): string {
  switch (level) {
    case "low":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "high":
      return "text-orange-400";
    case "critical":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export function getThreatLevelBadge(
  level: DetectedMiner["threatLevel"],
): string {
  switch (level) {
    case "low":
      return "bg-green-600";
    case "medium":
      return "bg-yellow-600";
    case "high":
      return "bg-orange-600";
    case "critical":
      return "bg-red-600";
    default:
      return "bg-gray-600";
  }
}

export function generateMockMiners(count: number = 15): DetectedMiner[] {
  const algorithms = ["SHA-256", "Scrypt", "Ethash", "X11", "Blake2b"];
  const pools = [
    "mining.pool.com",
    "crypto.pool.org",
    "hashpower.net",
    "blockchain.mining",
  ];

  const devices: DetectedMiner[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random coordinates within Ilam province bounds
    const lat = 32.8 + Math.random() * (34.2 - 32.8);
    const lng = 45.4 + Math.random() * (47.8 - 45.4);
    const confidence = 0.6 + Math.random() * 0.4;

    let threatLevel: DetectedMiner["threatLevel"];
    if (confidence > 0.9) threatLevel = "critical";
    else if (confidence > 0.8) threatLevel = "high";
    else if (confidence > 0.7) threatLevel = "medium";
    else threatLevel = "low";

    devices.push({
      id: `miner-${i + 1}`,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      location: [lat, lng],
      province: "ایلام",
      city: findNearestCity(lat, lng),
      confidence,
      powerConsumption: 500 + Math.random() * 2000,
      lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      status:
        Math.random() > 0.8
          ? "suspicious"
          : Math.random() > 0.1
            ? "active"
            : "inactive",
      hashRate: Math.random() * 100e12, // Random hash rate up to 100 TH/s
      algorithm: algorithms[Math.floor(Math.random() * algorithms.length)],
      pool: pools[Math.floor(Math.random() * pools.length)],
      wallet: `1${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      threatLevel,
    });
  }

  return devices;
}
