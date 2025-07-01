import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, AlertTriangle, Zap, Shield } from 'lucide-react';
import { Statistics } from '@/lib/types';

interface StatsOverviewProps {
  statistics?: Statistics;
}

export default function StatsOverview({ statistics }: StatsOverviewProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const formatPowerConsumption = (power: number) => {
    if (power >= 1000) {
      return `${(power / 1000).toFixed(1)} مگاوات`;
    }
    return `${formatNumber(power)} کیلووات`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Devices */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">دستگاه‌های شناسایی شده</p>
              <p className="text-2xl font-bold text-foreground persian-numbers">
                {statistics ? formatNumber(statistics.totalDevices) : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Monitor className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmed Miners */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">ماینرهای تأیید شده</p>
              <p className="text-2xl font-bold text-persian-error persian-numbers">
                {statistics ? formatNumber(statistics.confirmedMiners) : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-persian-error/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-persian-error" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Power Consumption */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">مصرف برق کل</p>
              <p className="text-2xl font-bold text-persian-warning persian-numbers">
                {statistics ? formatPowerConsumption(statistics.totalPowerConsumption) : '0 کیلووات'}
              </p>
            </div>
            <div className="w-12 h-12 bg-persian-warning/20 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-persian-warning" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Health */}
      <Card className="stats-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">وضعیت شبکه</p>
              <p className="text-2xl font-bold text-persian-success persian-numbers">
                {statistics ? `${statistics.networkHealth.toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="w-12 h-12 bg-persian-success/20 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-persian-success" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
