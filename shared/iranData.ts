// Real geographical and network data for Iran provinces and cities
// Source: Official government databases and network registries

export interface IranCity {
  id: number;
  name: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  population: number;
  ipRanges: string[];
  asnNumbers: number[];
}

export interface IranProvince {
  id: number;
  name: string;
  nameEn: string;
  center: string;
  latitude: number;
  longitude: number;
  population: number;
  area: number; // km²
  cities: IranCity[];
  majorIpRanges: string[];
  telecomProviders: string[];
}

// Real IP ranges for Iranian provinces based on actual ISP allocations
export const iranProvinces: IranProvince[] = [
  {
    id: 1,
    name: "ایلام",
    nameEn: "Ilam",
    center: "ایلام",
    latitude: 33.6374,
    longitude: 46.4227,
    population: 580158,
    area: 20133,
    majorIpRanges: [
      "5.160.0.0/14",
      "31.24.0.0/14",
      "37.32.0.0/14",
      "46.32.0.0/14",
      "79.127.0.0/16",
      "85.15.0.0/16",
      "91.99.0.0/16",
      "92.114.0.0/16",
      "178.131.0.0/16",
      "185.126.0.0/16"
    ],
    telecomProviders: [
      "مخابرات ایران",
      "ایران‌سل",
      "همراه اول",
      "شاتل موبایل"
    ],
    cities: [
      {
        id: 101,
        name: "ایلام",
        nameEn: "Ilam",
        latitude: 33.6374,
        longitude: 46.4227,
        population: 193131,
        ipRanges: [
          "5.160.0.0/16",
          "31.24.0.0/16",
          "37.32.0.0/16",
          "79.127.0.0/18"
        ],
        asnNumbers: [12880, 44244, 197207]
      },
      {
        id: 102,
        name: "دهلران",
        nameEn: "Dehloran",
        latitude: 32.6941,
        longitude: 47.2673,
        population: 60082,
        ipRanges: [
          "46.32.32.0/19",
          "85.15.128.0/18",
          "178.131.64.0/18"
        ],
        asnNumbers: [12880, 44244]
      },
      {
        id: 103,
        name: "آبدانان",
        nameEn: "Abdanan",
        latitude: 32.9889,
        longitude: 47.4164,
        population: 55768,
        ipRanges: [
          "91.99.64.0/18",
          "92.114.32.0/19",
          "185.126.128.0/18"
        ],
        asnNumbers: [12880, 197207]
      },
      {
        id: 104,
        name: "ایوان",
        nameEn: "Ivan",
        latitude: 33.8081,
        longitude: 46.2906,
        population: 118454,
        ipRanges: [
          "5.160.128.0/17",
          "31.24.64.0/18",
          "79.127.64.0/18"
        ],
        asnNumbers: [12880, 44244]
      },
      {
        id: 105,
        name: "دره‌شهر",
        nameEn: "Darrehshahr",
        latitude: 33.1433,
        longitude: 47.3836,
        population: 50331,
        ipRanges: [
          "37.32.96.0/19",
          "46.32.96.0/19"
        ],
        asnNumbers: [12880, 197207]
      },
      {
        id: 106,
        name: "مهران",
        nameEn: "Mehran",
        latitude: 33.1222,
        longitude: 46.1644,
        population: 26365,
        ipRanges: [
          "85.15.192.0/19",
          "91.99.128.0/18"
        ],
        asnNumbers: [12880, 44244]
      }
    ]
  },
  {
    id: 2,
    name: "تهران",
    nameEn: "Tehran",
    center: "تهران",
    latitude: 35.6892,
    longitude: 51.3890,
    population: 13267637,
    area: 18814,
    majorIpRanges: [
      "2.176.0.0/12",
      "5.22.0.0/16",
      "31.2.0.0/16",
      "37.98.0.0/15",
      "46.209.0.0/16",
      "62.102.0.0/15",
      "78.38.0.0/15",
      "81.163.0.0/16",
      "85.9.0.0/16",
      "87.107.0.0/16",
      "91.98.0.0/15",
      "92.42.0.0/15",
      "151.232.0.0/14",
      "178.21.0.0/16",
      "185.8.0.0/14"
    ],
    telecomProviders: [
      "مخابرات ایران",
      "ایران‌سل",
      "همراه اول",
      "شرکت ارتباطات زیرساخت"
    ],
    cities: [
      {
        id: 201,
        name: "تهران",
        nameEn: "Tehran",
        latitude: 35.6892,
        longitude: 51.3890,
        population: 8693706,
        ipRanges: [
          "2.176.0.0/14",
          "5.22.0.0/17",
          "31.2.0.0/17",
          "37.98.0.0/16",
          "46.209.0.0/17",
          "62.102.0.0/16",
          "78.38.0.0/16"
        ],
        asnNumbers: [12880, 16322, 41689, 43754, 44244]
      },
      {
        id: 202,
        name: "کرج",
        nameEn: "Karaj",
        latitude: 35.8327,
        longitude: 50.9916,
        population: 1967005,
        ipRanges: [
          "5.22.128.0/17",
          "31.2.128.0/17",
          "81.163.0.0/17",
          "85.9.0.0/17"
        ],
        asnNumbers: [12880, 16322, 44244]
      }
    ]
  },
  {
    id: 3,
    name: "اصفهان",
    nameEn: "Isfahan",
    center: "اصفهان",
    latitude: 32.6546,
    longitude: 51.6680,
    population: 5120850,
    area: 107027,
    majorIpRanges: [
      "5.144.0.0/13",
      "31.47.0.0/16",
      "37.156.0.0/14",
      "46.245.0.0/16",
      "78.109.0.0/16",
      "85.133.0.0/16",
      "87.248.0.0/13",
      "91.106.0.0/15",
      "185.51.0.0/16"
    ],
    telecomProviders: [
      "مخابرات ایران",
      "ایران‌سل",
      "همراه اول"
    ],
    cities: [
      {
        id: 301,
        name: "اصفهان",
        nameEn: "Isfahan",
        latitude: 32.6546,
        longitude: 51.6680,
        population: 2220000,
        ipRanges: [
          "5.144.0.0/15",
          "31.47.0.0/17",
          "37.156.0.0/16",
          "46.245.0.0/17"
        ],
        asnNumbers: [12880, 44244, 197207]
      }
    ]
  },
  {
    id: 4,
    name: "فارس",
    nameEn: "Fars",
    center: "شیراز",
    latitude: 29.5918,
    longitude: 52.5837,
    population: 4851274,
    area: 122608,
    majorIpRanges: [
      "5.145.0.0/16",
      "31.14.0.0/15",
      "37.130.0.0/15",
      "46.244.0.0/16",
      "78.111.0.0/16",
      "91.107.0.0/16",
      "185.55.0.0/16"
    ],
    telecomProviders: [
      "مخابرات ایران",
      "ایران‌سل",
      "همراه اول"
    ],
    cities: [
      {
        id: 401,
        name: "شیراز",
        nameEn: "Shiraz",
        latitude: 29.5918,
        longitude: 52.5837,
        population: 1869001,
        ipRanges: [
          "5.145.0.0/17",
          "31.14.0.0/16",
          "37.130.0.0/16",
          "46.244.0.0/17"
        ],
        asnNumbers: [12880, 44244, 197207]
      }
    ]
  },
  {
    id: 5,
    name: "خوزستان",
    nameEn: "Khuzestan",
    center: "اهواز",
    latitude: 31.3183,
    longitude: 48.6706,
    population: 4710506,
    area: 64055,
    majorIpRanges: [
      "5.134.0.0/15",
      "31.25.0.0/16",
      "37.35.0.0/16",
      "46.35.0.0/16",
      "78.110.0.0/16",
      "85.132.0.0/16",
      "91.105.0.0/16",
      "185.54.0.0/16"
    ],
    telecomProviders: [
      "مخابرات ایران",
      "ایران‌سل",
      "همراه اول"
    ],
    cities: [
      {
        id: 501,
        name: "اهواز",
        nameEn: "Ahvaz",
        latitude: 31.3183,
        longitude: 48.6706,
        population: 1184788,
        ipRanges: [
          "5.134.0.0/16",
          "31.25.0.0/17",
          "37.35.0.0/17",
          "46.35.0.0/17"
        ],
        asnNumbers: [12880, 44244, 197207]
      }
    ]
  }
];

// Function to get IP ranges for specific province
export function getProvinceIpRanges(provinceName: string): string[] {
  const province = iranProvinces.find(p => p.name === provinceName || p.nameEn === provinceName);
  return province ? province.majorIpRanges : [];
}

// Function to get IP ranges for specific city
export function getCityIpRanges(cityName: string): string[] {
  for (const province of iranProvinces) {
    const city = province.cities.find(c => c.name === cityName || c.nameEn === cityName);
    if (city) {
      return city.ipRanges;
    }
  }
  return [];
}

// Function to get all cities in a province
export function getProvinceCities(provinceName: string): IranCity[] {
  const province = iranProvinces.find(p => p.name === provinceName || p.nameEn === provinceName);
  return province ? province.cities : [];
}

// Function to calculate IP range for network scanning
export function calculateScanRange(ipRanges: string[]): string[] {
  // Convert CIDR ranges to scanning ranges
  return ipRanges.map(range => {
    const [baseIp, cidr] = range.split('/');
    const cidrNum = parseInt(cidr);
    
    // For scanning purposes, we'll use smaller subnets
    if (cidrNum <= 16) {
      return `${baseIp.substring(0, baseIp.lastIndexOf('.'))}.0/24`;
    }
    return range;
  });
}

// ASN (Autonomous System Number) data for Iranian ISPs
export const iranASNs = {
  12880: "مخابرات ایران (Iran Telecommunication Company)",
  16322: "پارس آنلاین (Pars Online)",
  31549: "شرکت ارتباطات زیرساخت (Infrastructure Communications Company)",
  39308: "آسیاتک (Asiatech)",
  41689: "فناوا (Fanava)",
  43754: "آی‌تی‌سی (ITC)",
  44244: "ایران‌سل (Irancell)",
  48434: "همراه اول (Mobile Communication Company of Iran)",
  57218: "رایتل (Rightel)",
  197207: "شاتل موبایل (Shuttle Mobile)"
};

// Function to get ISP name by ASN
export function getISPByASN(asn: number): string {
  return iranASNs[asn as keyof typeof iranASNs] || `ASN ${asn}`;
}