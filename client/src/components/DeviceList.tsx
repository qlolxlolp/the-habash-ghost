import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { List, RotateCcw, Search, Eye } from 'lucide-react';
import { DetectedMiner } from '@/lib/types';
import { formatHashRate, formatPowerConsumption, formatConfidenceScore, getThreatLevelColor } from '@/lib/mapUtils';

interface DeviceListProps {
  miners?: DetectedMiner[];
}

export default function DeviceList({ miners = [] }: DeviceListProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<DetectedMiner | null>(null);

  const filteredMiners = miners.filter(miner => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'miners' && miner.threatLevel === 'high') ||
      (filter === 'suspicious' && miner.threatLevel === 'medium') ||
      (filter === 'normal' && miner.threatLevel === 'low');

    const matchesSearch = 
      !searchTerm || 
      miner.ipAddress.includes(searchTerm) ||
      miner.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      miner.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      miner.deviceType?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getThreatLevelLabel = (level: string) => {
    switch (level) {
      case 'high': return 'ماینر تأیید شده';
      case 'medium': return 'مشکوک';
      case 'low': return 'عادی';
      default: return 'نامشخص';
    }
  };

  const getThreatLevelVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatDetectionTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'الان';
    if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} روز پیش`;
  };

  return (
    <>
      <Card className="persian-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-lg">
              <List className="ml-2 h-5 w-5 text-primary" />
              دستگاه‌های شناسایی شده
            </CardTitle>
            <div className="flex space-x-reverse space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="focus-ring"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col space-y-3 pt-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس IP، نام میزبان، شهر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 focus-ring"
              />
            </div>
            
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full focus-ring">
                <SelectValue placeholder="فیلتر دستگاه‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه ({miners.length})</SelectItem>
                <SelectItem value="miners">ماینرهای تأیید شده ({miners.filter(m => m.threatLevel === 'high').length})</SelectItem>
                <SelectItem value="suspicious">مشکوک ({miners.filter(m => m.threatLevel === 'medium').length})</SelectItem>
                <SelectItem value="normal">عادی ({miners.filter(m => m.threatLevel === 'low').length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {filteredMiners.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                {searchTerm || filter !== 'all' ? 
                  'هیچ دستگاهی با معیارهای جستجو یافت نشد' : 
                  'هنوز دستگاهی شناسایی نشده است'
                }
              </div>
            ) : (
              filteredMiners.map((miner) => (
                <div
                  key={miner.id}
                  className="device-row p-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-persian-surface-variant/50"
                  onClick={() => setSelectedDevice(miner)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          miner.threatLevel === 'high' ? 'bg-persian-error animate-pulse' :
                          miner.threatLevel === 'medium' ? 'bg-persian-warning animate-pulse-slow' :
                          'bg-persian-success'
                        }`}
                      />
                      <div>
                        <div className="text-foreground font-medium persian-numbers">
                          {miner.ipAddress}
                        </div>
                        <div className="text-sm text-muted-foreground persian-numbers">
                          {miner.macAddress || 'MAC نامشخص'}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge variant={getThreatLevelVariant(miner.threatLevel)} className="mb-1">
                        {getThreatLevelLabel(miner.threatLevel)}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        امتیاز: {formatConfidenceScore(miner.confidenceScore)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">نوع:</span> {miner.deviceType || 'نامشخص'}
                    </div>
                    <div>
                      <span className="font-medium">شهر:</span> {miner.city || 'نامشخص'}
                    </div>
                    <div>
                      <span className="font-medium">زمان:</span> {formatDetectionTime(miner.detectionTime)}
                    </div>
                  </div>

                  {(miner.hashRate || miner.powerConsumption) && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {miner.hashRate && (
                        <div className="text-muted-foreground">
                          <span className="font-medium">نرخ هش:</span> {formatHashRate(miner.hashRate)}
                        </div>
                      )}
                      {miner.powerConsumption && (
                        <div className="text-muted-foreground">
                          <span className="font-medium">مصرف برق:</span> {formatPowerConsumption(miner.powerConsumption)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Details Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Eye className="ml-2 h-5 w-5 text-primary" />
                  جزئیات دستگاه
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDevice(null)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-3">اطلاعات پایه</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">آدرس IP:</span>
                    <span className="mr-2 font-medium persian-numbers">{selectedDevice.ipAddress}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">آدرس MAC:</span>
                    <span className="mr-2 font-medium persian-numbers">{selectedDevice.macAddress || 'نامشخص'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">نام میزبان:</span>
                    <span className="mr-2 font-medium">{selectedDevice.hostname || 'نامشخص'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">نوع دستگاه:</span>
                    <span className="mr-2 font-medium">{selectedDevice.deviceType || 'نامشخص'}</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              {(selectedDevice.latitude || selectedDevice.city) && (
                <div>
                  <h3 className="font-semibold mb-3">موقعیت مکانی</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">شهر:</span>
                      <span className="mr-2 font-medium">{selectedDevice.city || 'نامشخص'}</span>
                    </div>
                    {selectedDevice.latitude && selectedDevice.longitude && (
                      <>
                        <div>
                          <span className="text-muted-foreground">عرض جغرافیایی:</span>
                          <span className="mr-2 font-medium persian-numbers">{selectedDevice.latitude.toFixed(6)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">طول جغرافیایی:</span>
                          <span className="mr-2 font-medium persian-numbers">{selectedDevice.longitude.toFixed(6)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Detection Info */}
              <div>
                <h3 className="font-semibold mb-3">اطلاعات تشخیص</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">امتیاز اطمینان:</span>
                    <span className="mr-2 font-medium">{formatConfidenceScore(selectedDevice.confidenceScore)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">سطح تهدید:</span>
                    <Badge variant={getThreatLevelVariant(selectedDevice.threatLevel)} className="mr-2">
                      {getThreatLevelLabel(selectedDevice.threatLevel)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">روش تشخیص:</span>
                    <span className="mr-2 font-medium">{selectedDevice.detectionMethod}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">زمان تشخیص:</span>
                    <span className="mr-2 font-medium">{new Date(selectedDevice.detectionTime).toLocaleString('fa-IR')}</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              {(selectedDevice.hashRate || selectedDevice.powerConsumption || selectedDevice.cpuUsage) && (
                <div>
                  <h3 className="font-semibold mb-3">معیارهای عملکرد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDevice.hashRate && (
                      <div>
                        <span className="text-muted-foreground">نرخ هش:</span>
                        <span className="mr-2 font-medium">{formatHashRate(selectedDevice.hashRate)}</span>
                      </div>
                    )}
                    {selectedDevice.powerConsumption && (
                      <div>
                        <span className="text-muted-foreground">مصرف برق:</span>
                        <span className="mr-2 font-medium">{formatPowerConsumption(selectedDevice.powerConsumption)}</span>
                      </div>
                    )}
                    {selectedDevice.cpuUsage && (
                      <div>
                        <span className="text-muted-foreground">استفاده CPU:</span>
                        <span className="mr-2 font-medium persian-numbers">{selectedDevice.cpuUsage.toFixed(1)}%</span>
                      </div>
                    )}
                    {selectedDevice.memoryUsage && (
                      <div>
                        <span className="text-muted-foreground">استفاده حافظه:</span>
                        <span className="mr-2 font-medium persian-numbers">{(selectedDevice.memoryUsage / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedDevice.notes && (
                <div>
                  <h3 className="font-semibold mb-3">یادداشت‌ها</h3>
                  <div className="bg-persian-surface-variant p-3 rounded-lg text-sm">
                    {selectedDevice.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
