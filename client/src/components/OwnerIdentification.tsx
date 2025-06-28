import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Phone, 
  MapPin, 
  Shield, 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Clock,
  Network,
  Fingerprint
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface OwnerInfo {
  name?: string;
  family?: string;
  phone?: string;
  national_id?: string;
  address?: string;
  isp?: string;
  contract_type?: string;
  confidence?: number;
  source?: string;
}

interface DeviceInfo {
  vendor?: string;
  device_type?: string;
  mac_oui?: string;
  source?: string;
}

interface OwnerIdentificationResult {
  ip_address: string;
  mac_address?: string;
  timestamp: string;
  sources_checked: string[];
  owner_info?: OwnerInfo;
  device_info?: DeviceInfo;
  confidence_score: number;
  lookup_time: number;
}

export default function OwnerIdentification() {
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [result, setResult] = useState<OwnerIdentificationResult | null>(null);
  const { toast } = useToast();

  const identifyOwnerMutation = useMutation({
    mutationFn: async (data: { ipAddress: string; macAddress?: string }) => {
      const response = await apiRequest('POST', '/api/identify-owner', data);
      return await response.json();
    },
    onSuccess: (data: OwnerIdentificationResult) => {
      setResult(data);
      if (data.owner_info) {
        toast({
          title: "شناسایی موفق",
          description: `صاحب دستگاه با اطمینان ${data.confidence_score * 100}% شناسایی شد`,
        });
      } else {
        toast({
          title: "شناسایی ناموفق",
          description: "اطلاعات صاحب دستگاه یافت نشد",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "خطا در شناسایی",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleIdentify = () => {
    if (!ipAddress.trim()) {
      toast({
        title: "خطا",
        description: "آدرس IP الزامی است",
        variant: "destructive",
      });
      return;
    }

    const data: { ipAddress: string; macAddress?: string } = {
      ipAddress: ipAddress.trim(),
    };

    if (macAddress.trim()) {
      data.macAddress = macAddress.trim();
    }

    identifyOwnerMutation.mutate(data);
  };

  const formatConfidence = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    return percentage;
  };

  const getConfidenceColor = (confidence: number) => {
    const percentage = confidence * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSourceDescription = (source: string) => {
    const sources: Record<string, string> = {
      'tci_official_api': 'API رسمی مخابرات ایران',
      'whois_lookup': 'پایگاه داده WHOIS',
      'cellular': 'اپراتور تلفن همراه',
      'cache': 'کش محلی',
      'mac_vendor': 'پایگاه داده IEEE MAC',
      'ieee_oui_database': 'دیتابیس رسمی IEEE'
    };
    return sources[source] || source;
  };

  return (
    <Card className="persian-card">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Fingerprint className="ml-2 h-5 w-5 text-primary" />
          شناسایی صاحب دستگاه
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          شناسایی هویت صاحب دستگاه ماینر بر اساس IP و MAC address
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <Network className="ml-1 h-4 w-4" />
              آدرس IP (الزامی)
            </Label>
            <Input
              placeholder="192.168.1.100"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="focus-ring persian-numbers"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <Fingerprint className="ml-1 h-4 w-4" />
              آدرس MAC (اختیاری)
            </Label>
            <Input
              placeholder="AA:BB:CC:DD:EE:FF"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              className="focus-ring"
            />
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleIdentify}
          disabled={identifyOwnerMutation.isPending}
          className="w-full focus-ring"
        >
          {identifyOwnerMutation.isPending ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              در حال شناسایی...
            </>
          ) : (
            <>
              <Search className="ml-2 h-4 w-4" />
              شناسایی صاحب دستگاه
            </>
          )}
        </Button>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Query Information */}
              <div className="p-4 bg-persian-surface-variant/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-reverse space-x-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">اطلاعات جستجو</span>
                  </div>
                  <Badge variant="outline" className="persian-numbers">
                    {formatConfidence(result.confidence_score)}% اطمینان
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-muted-foreground">IP مورد بررسی</div>
                    <div className="font-bold persian-numbers">{result.ip_address}</div>
                  </div>
                  {result.mac_address && (
                    <div>
                      <div className="text-muted-foreground">MAC Address</div>
                      <div className="font-bold">{result.mac_address}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground">زمان جستجو</div>
                    <div className="font-bold persian-numbers">{result.lookup_time.toFixed(2)} ثانیه</div>
                  </div>
                </div>

                {/* Sources Checked */}
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">منابع بررسی شده:</div>
                  <div className="flex flex-wrap gap-1">
                    {result.sources_checked.map((source, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {getSourceDescription(source)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              {result.owner_info ? (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-reverse space-x-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-400">
                      اطلاعات صاحب دستگاه یافت شد
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getConfidenceColor(result.confidence_score)}`}
                    >
                      اطمینان: {formatConfidence(result.confidence_score)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal Information */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center">
                        <User className="ml-1 h-4 w-4" />
                        اطلاعات شخصی
                      </h4>
                      
                      {(result.owner_info.name || result.owner_info.family) && (
                        <div>
                          <Label className="text-xs text-muted-foreground">نام و نام خانوادگی</Label>
                          <div className="font-bold">
                            {[result.owner_info.name, result.owner_info.family].filter(Boolean).join(' ') || 'نامشخص'}
                          </div>
                        </div>
                      )}

                      {result.owner_info.phone && (
                        <div>
                          <Label className="text-xs text-muted-foreground">شماره تلفن</Label>
                          <div className="font-bold persian-numbers flex items-center">
                            <Phone className="ml-1 h-3 w-3" />
                            {result.owner_info.phone}
                          </div>
                        </div>
                      )}

                      {result.owner_info.national_id && (
                        <div>
                          <Label className="text-xs text-muted-foreground">کد ملی</Label>
                          <div className="font-bold persian-numbers">{result.owner_info.national_id}</div>
                        </div>
                      )}
                    </div>

                    {/* Connection Information */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center">
                        <Network className="ml-1 h-4 w-4" />
                        اطلاعات اتصال
                      </h4>

                      {result.owner_info.isp && (
                        <div>
                          <Label className="text-xs text-muted-foreground">ارائه‌دهنده اینترنت</Label>
                          <div className="font-bold">{result.owner_info.isp}</div>
                        </div>
                      )}

                      {result.owner_info.contract_type && (
                        <div>
                          <Label className="text-xs text-muted-foreground">نوع قرارداد</Label>
                          <div className="font-bold">{result.owner_info.contract_type}</div>
                        </div>
                      )}

                      {result.owner_info.source && (
                        <div>
                          <Label className="text-xs text-muted-foreground">منبع اطلاعات</Label>
                          <div className="font-bold">{getSourceDescription(result.owner_info.source)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  {result.owner_info.address && (
                    <div className="mt-4 pt-3 border-t border-green-200 dark:border-green-800">
                      <Label className="text-xs text-muted-foreground flex items-center">
                        <MapPin className="ml-1 h-3 w-3" />
                        آدرس
                      </Label>
                      <div className="font-bold mt-1">{result.owner_info.address}</div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    اطلاعات صاحب دستگاه یافت نشد. ممکن است IP خصوصی باشد یا در پایگاه‌های داده موجود نباشد.
                  </AlertDescription>
                </Alert>
              )}

              {/* Device Information */}
              {result.device_info && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center space-x-reverse space-x-2 mb-3">
                    <Fingerprint className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-400">
                      اطلاعات دستگاه
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {result.device_info.vendor && (
                      <div>
                        <Label className="text-xs text-muted-foreground">سازنده</Label>
                        <div className="font-bold">{result.device_info.vendor}</div>
                      </div>
                    )}

                    {result.device_info.device_type && (
                      <div>
                        <Label className="text-xs text-muted-foreground">نوع دستگاه</Label>
                        <div className="font-bold">
                          {result.device_info.device_type === 'mining_hardware' ? 'سخت‌افزار ماینینگ' :
                           result.device_info.device_type === 'gpu_device' ? 'کارت گرافیک' :
                           result.device_info.device_type === 'network_equipment' ? 'تجهیزات شبکه' :
                           result.device_info.device_type || 'نامشخص'}
                        </div>
                      </div>
                    )}

                    {result.device_info.mac_oui && (
                      <div>
                        <Label className="text-xs text-muted-foreground">MAC OUI</Label>
                        <div className="font-bold">{result.device_info.mac_oui}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="ml-1 h-3 w-3" />
                شناسایی شده در: {new Date(result.timestamp).toLocaleString('fa-IR')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>نکته حریم خصوصی:</strong> این سیستم تنها برای مقاصد امنیتی و تشخیص ماینرهای غیرمجاز طراحی شده است. 
            تمامی اطلاعات از منابع رسمی و مجاز دریافت می‌شود و مطابق قوانین حریم خصوصی جمهوری اسلامی ایران استفاده می‌گردد.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}