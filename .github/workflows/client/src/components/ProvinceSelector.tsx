import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin, Wifi, Users, Network, Info } from 'lucide-react';
import { iranProvinces, getProvinceCities, getProvinceIpRanges, getCityIpRanges, calculateScanRange, getISPByASN } from '@shared/iranData';
import type { IranProvince, IranCity } from '@shared/iranData';
import { motion, AnimatePresence } from 'framer-motion';

interface ProvinceSelectorProps {
  onSelectionChange: (data: {
    province?: IranProvince;
    city?: IranCity;
    ipRanges: string[];
    scanRanges: string[];
  }) => void;
  selectedProvince?: string;
  selectedCity?: string;
}

export default function ProvinceSelector({ onSelectionChange, selectedProvince, selectedCity }: ProvinceSelectorProps) {
  const [province, setProvince] = useState<IranProvince | null>(null);
  const [city, setCity] = useState<IranCity | null>(null);
  const [cities, setCities] = useState<IranCity[]>([]);
  const [customRange, setCustomRange] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (selectedProvince) {
      const foundProvince = iranProvinces.find(p => p.name === selectedProvince);
      if (foundProvince) {
        setProvince(foundProvince);
        setCities(foundProvince.cities);
      }
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity && cities.length > 0) {
      const foundCity = cities.find(c => c.name === selectedCity);
      if (foundCity) {
        setCity(foundCity);
      }
    }
  }, [selectedCity, cities]);

  const handleProvinceChange = (provinceName: string) => {
    const selectedProvince = iranProvinces.find(p => p.name === provinceName);
    if (selectedProvince) {
      setProvince(selectedProvince);
      setCities(selectedProvince.cities);
      setCity(null);
      
      const ipRanges = getProvinceIpRanges(provinceName);
      const scanRanges = calculateScanRange(ipRanges);
      
      onSelectionChange({
        province: selectedProvince,
        ipRanges,
        scanRanges
      });
    }
  };

  const handleCityChange = (cityName: string) => {
    const selectedCity = cities.find(c => c.name === cityName);
    if (selectedCity) {
      setCity(selectedCity);
      
      const ipRanges = getCityIpRanges(cityName);
      const scanRanges = calculateScanRange(ipRanges);
      
      onSelectionChange({
        province,
        city: selectedCity,
        ipRanges,
        scanRanges
      });
    }
  };

  const handleCustomRange = () => {
    if (customRange.trim()) {
      const ranges = customRange.split(',').map(r => r.trim());
      const scanRanges = calculateScanRange(ranges);
      
      onSelectionChange({
        province,
        city,
        ipRanges: ranges,
        scanRanges
      });
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const getCurrentIpRanges = () => {
    if (city) return city.ipRanges;
    if (province) return province.majorIpRanges;
    return [];
  };

  const getCurrentASNs = () => {
    if (city) return city.asnNumbers;
    return [];
  };

  return (
    <Card className="persian-card">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <MapPin className="ml-2 h-5 w-5 text-primary" />
          انتخاب منطقه جغرافیایی و شبکه
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          انتخاب استان و شهر برای تعیین محدوده IP های اسکن
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Province Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">انتخاب استان</Label>
          <Select onValueChange={handleProvinceChange} value={province?.name || ""}>
            <SelectTrigger className="focus-ring">
              <SelectValue placeholder="استان را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {iranProvinces.map((prov) => (
                <SelectItem key={prov.id} value={prov.name}>
                  <div className="flex items-center justify-between w-full">
                    <span>{prov.name}</span>
                    <Badge variant="outline" className="text-xs mr-2">
                      {formatNumber(prov.population)} نفر
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Selection */}
        {province && cities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Label className="text-sm font-medium">انتخاب شهر (اختیاری)</Label>
            <Select onValueChange={handleCityChange} value={city?.name || ""}>
              <SelectTrigger className="focus-ring">
                <SelectValue placeholder="شهر را انتخاب کنید" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((cityItem) => (
                  <SelectItem key={cityItem.id} value={cityItem.name}>
                    <div className="flex items-center justify-between w-full">
                      <span>{cityItem.name}</span>
                      <Badge variant="outline" className="text-xs mr-2">
                        {formatNumber(cityItem.population)} نفر
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {/* Custom IP Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">محدوده IP سفارشی</Label>
          <div className="flex space-x-reverse space-x-2">
            <Input
              placeholder="192.168.1.0/24, 10.0.0.0/16"
              value={customRange}
              onChange={(e) => setCustomRange(e.target.value)}
              className="flex-1 focus-ring persian-numbers"
            />
            <Button 
              onClick={handleCustomRange}
              variant="outline"
              className="focus-ring"
              disabled={!customRange.trim()}
            >
              اعمال
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            چندین محدوده را با کاما جدا کنید
          </p>
        </div>

        {/* Selection Info */}
        {(province || getCurrentIpRanges().length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Geographic Info */}
            {(province || city) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-persian-surface-variant/30 rounded-lg">
                  <div className="flex items-center space-x-reverse space-x-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">موقعیت جغرافیایی</span>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    {province && (
                      <div>استان: <span className="text-foreground">{province.name}</span></div>
                    )}
                    {city && (
                      <div>شهر: <span className="text-foreground">{city.name}</span></div>
                    )}
                    {province && (
                      <div>مساحت: <span className="text-foreground persian-numbers">{formatNumber(province.area)} کیلومتر مربع</span></div>
                    )}
                    <div>جمعیت: <span className="text-foreground persian-numbers">{formatNumber((city || province)?.population || 0)} نفر</span></div>
                  </div>
                </div>

                <div className="p-3 bg-persian-surface-variant/30 rounded-lg">
                  <div className="flex items-center space-x-reverse space-x-2 mb-2">
                    <Users className="h-4 w-4 text-persian-secondary" />
                    <span className="text-sm font-medium">ارائه‌دهندگان اینترنت</span>
                  </div>
                  <div className="text-xs space-y-1">
                    {province?.telecomProviders.map((provider, index) => (
                      <Badge key={index} variant="outline" className="text-xs block">
                        {provider}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Network Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-reverse space-x-2">
                  <Network className="h-4 w-4 text-persian-accent" />
                  <span className="text-sm font-medium">محدوده‌های شبکه</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="focus-ring"
                >
                  <Info className="h-4 w-4 ml-1" />
                  {showDetails ? 'مخفی کردن' : 'جزئیات'}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {getCurrentIpRanges().slice(0, showDetails ? undefined : 6).map((range, index) => (
                  <Badge key={index} variant="outline" className="text-xs justify-center persian-numbers">
                    {range}
                  </Badge>
                ))}
                {!showDetails && getCurrentIpRanges().length > 6 && (
                  <Badge variant="secondary" className="text-xs justify-center">
                    +{formatNumber(getCurrentIpRanges().length - 6)} محدوده دیگر
                  </Badge>
                )}
              </div>

              {/* ASN Information */}
              {getCurrentASNs().length > 0 && (
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">شماره‌های AS (Autonomous System):</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getCurrentASNs().map((asn, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        AS{asn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scan Statistics */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center space-x-reverse space-x-2 mb-2">
                <Wifi className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">آمار اسکن</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground">تعداد محدوده‌ها</div>
                  <div className="font-bold persian-numbers">{formatNumber(getCurrentIpRanges().length)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">تخمین IP ها</div>
                  <div className="font-bold persian-numbers">
                    {formatNumber(getCurrentIpRanges().reduce((total, range) => {
                      const cidr = parseInt(range.split('/')[1] || '24');
                      return total + Math.pow(2, 32 - cidr);
                    }, 0))}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">ISP ها</div>
                  <div className="font-bold persian-numbers">
                    {getCurrentASNs().length || province?.telecomProviders.length || 0}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">نوع اسکن</div>
                  <div className="font-bold">
                    {city ? 'شهری' : province ? 'استانی' : 'سفارشی'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}