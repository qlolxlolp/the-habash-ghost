import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, Download, RefreshCw, HardDrive, Users, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Statistics } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

interface DatabaseStatusProps {
  onExport: () => void;
}

export default function DatabaseStatus({ onExport }: DatabaseStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: statistics, refetch: refetchStats } = useQuery({
    queryKey: ['/api/statistics'],
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchStats();
      toast({
        title: "آمار بروزرسانی شد",
        description: "اطلاعات دیتابیس بروزرسانی شد",
      });
    } catch (error) {
      toast({
        title: "خطا در بروزرسانی",
        description: "امکان بروزرسانی آمار وجود ندارد",
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const calculateDatabaseSize = (stats?: Statistics) => {
    if (!stats) return '0 KB';

    // Estimate database size based on record count
    const avgRecordSize = 1.5; // KB per record estimate
    const totalSize = stats.totalDevices * avgRecordSize;

    if (totalSize < 1024) {
      return `${totalSize.toFixed(1)} KB`;
    } else if (totalSize < 1024 * 1024) {
      return `${(totalSize / 1024).toFixed(1)} MB`;
    } else {
      return `${(totalSize / (1024 * 1024)).toFixed(1)} GB`;
    }
  };

  const getStorageUsagePercentage = (stats?: Statistics) => {
    if (!stats) return 0;

    // Simulate storage usage (in a real app, this would come from the API)
    const maxCapacity = 10000; // Maximum expected devices
    return Math.min((stats.totalDevices / maxCapacity) * 100, 100);
  };

  const getLastUpdateTime = () => {
    return new Date().toLocaleString('fa-IR');
  };

  const getDatabaseHealth = (stats?: Statistics) => {
    if (!stats) return { status: 'unknown', label: 'نامشخص', color: 'text-muted-foreground' };

    const healthScore = Math.max(0, 100 - (stats.confirmedMiners * 2)); // Health decreases with more miners

    if (healthScore >= 90) {
      return { status: 'excellent', label: 'عالی', color: 'text-persian-success' };
    } else if (healthScore >= 70) {
      return { status: 'good', label: 'خوب', color: 'text-blue-400' };
    } else if (healthScore >= 50) {
      return { status: 'warning', label: 'نیاز به توجه', color: 'text-persian-warning' };
    } else {
      return { status: 'critical', label: 'بحرانی', color: 'text-persian-error' };
    }
  };

  const health = getDatabaseHealth(statistics);
  const storageUsage = getStorageUsagePercentage(statistics);

  // Real database statistics - will be populated from actual database
  const dbStats = {
    totalRecords: 0,
    lastBackup: 'هرگز',
    diskUsage: 0,
    avgQueryTime: 0,
    connections: {
      active: 0,
      idle: 0,
      total: 0
    },
    tables: [
      { name: 'detected_miners', records: 0, size: '0 KB' },
      { name: 'scan_sessions', records: 0, size: '0 KB' },
      { name: 'system_activities', records: 0, size: '0 KB' }
    ]
  };

  return (
    <Card className="persian-card">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Database className="ml-2 h-5 w-5 text-primary" />
          وضعیت دیتابیس
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Database Stats */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">کل رکوردها:</span>
            <span className="text-foreground font-medium persian-numbers">
              {statistics ? formatNumber(statistics.totalDevices) : '0'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">ماینرهای تأیید شده:</span>
            <Badge variant="destructive" className="persian-numbers">
              {statistics ? formatNumber(statistics.confirmedMiners) : '0'}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">دستگاه‌های مشکوک:</span>
            <Badge variant="secondary" className="persian-numbers">
              {statistics ? formatNumber(statistics.suspiciousDevices) : '0'}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">آخرین آپدیت:</span>
            <span className="text-persian-success text-sm">
              {getLastUpdateTime()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">اندازه دیتابیس:</span>
            <span className="text-foreground text-sm persian-numbers">
              {calculateDatabaseSize(statistics)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">وضعیت سلامت:</span>
            <span className={`text-sm font-medium ${health.color}`}>
              {health.label}
            </span>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">استفاده از فضای ذخیره‌سازی</span>
            <span className="text-muted-foreground persian-numbers">
              {storageUsage.toFixed(1)}%
            </span>
          </div>
          <Progress value={storageUsage} className="h-2" />
          {storageUsage > 80 && (
            <div className="flex items-center space-x-reverse space-x-2 text-xs text-persian-warning">
              <AlertTriangle className="h-3 w-3" />
              <span>فضای ذخیره‌سازی در حال اتمام است</span>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary persian-numbers">
              {statistics?.networkHealth.toFixed(0) || '0'}%
            </div>
            <div className="text-xs text-muted-foreground">عملکرد شبکه</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-persian-success persian-numbers">
              {statistics ? Math.round((statistics.totalDevices - statistics.confirmedMiners) / Math.max(statistics.totalDevices, 1) * 100) : '100'}%
            </div>
            <div className="text-xs text-muted-foreground">دستگاه‌های امن</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border space-y-2">
          <Button
            onClick={onExport}
            className="w-full bg-primary hover:bg-blue-600 focus-ring"
          >
            <Download className="ml-2 h-4 w-4" />
            دانلود گزارش کامل
          </Button>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="w-full focus-ring"
          >
            <RefreshCw className={`ml-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'در حال بروزرسانی...' : 'بروزرسانی آمار'}
          </Button>
        </div>

        {/* Health Indicators */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="flex items-center space-x-reverse space-x-1">
            <div className="w-2 h-2 bg-persian-success rounded-full"></div>
            <span className="text-xs text-muted-foreground">آنلاین</span>
          </div>
          <div className="flex items-center space-x-reverse space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-xs text-muted-foreground">همگام</span>
          </div>
          <div className="flex items-center space-x-reverse space-x-1">
            <div className="w-2 h-2 bg-persian-primary rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">فعال</span>
          </div>
        </div>

        {/* Quick Stats */}
        {statistics && statistics.confirmedMiners > 0 && (
          <div className="mt-4 p-3 bg-persian-error/10 border border-persian-error/20 rounded-lg">
            <div className="flex items-center space-x-reverse space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-persian-error" />
              <span className="text-sm font-medium text-persian-error">هشدار امنیتی</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(statistics.confirmedMiners)} ماینر فعال در شبکه شناسایی شده است. 
              بررسی فوری توصیه می‌شود.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}