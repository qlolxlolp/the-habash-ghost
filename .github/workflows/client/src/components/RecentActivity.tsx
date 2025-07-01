import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Eye } from 'lucide-react';
import { SystemActivity } from '@/lib/types';

interface RecentActivityProps {
  activities?: SystemActivity[];
}

export default function RecentActivity({ activities = [] }: RecentActivityProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-persian-error';
      case 'warning':
        return 'bg-persian-warning';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-persian-success';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'بحرانی';
      case 'warning':
        return 'هشدار';
      case 'info':
        return 'اطلاع';
      default:
        return 'موفق';
    }
  };

  const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'default';
      default:
        return 'outline';
    }
  };

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'الان';
    if (diffMinutes < 60) return `${diffMinutes} دقیقه پیش`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} روز پیش`;
    
    return date.toLocaleDateString('fa-IR');
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'miner_detected':
        return '⚠️';
      case 'scan_started':
        return '🔍';
      case 'scan_completed':
        return '✅';
      case 'scan_failed':
        return '❌';
      case 'network_scan':
        return '📡';
      case 'geolocation':
        return '📍';
      case 'system_startup':
        return '🚀';
      case 'database_update':
        return '💾';
      default:
        return 'ℹ️';
    }
  };

  // Only show real activities
  const displayActivities = activities;

  return (
    <Card className="persian-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-lg">
            <History className="ml-2 h-5 w-5 text-primary" />
            فعالیت‌های اخیر
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="focus-ring"
          >
            <Eye className="ml-2 h-4 w-4" />
            مشاهده همه
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {displayActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>هنوز فعالیتی ثبت نشده است</p>
                <p className="text-sm mt-2">
                  فعالیت‌های سیستم و نتایج اسکن اینجا نمایش داده می‌شوند
                </p>
              </div>
            ) : (
              displayActivities.slice(0, 20).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-reverse space-x-3 p-3 bg-persian-surface-variant/50 rounded-lg hover:bg-persian-surface-variant transition-colors"
                >
                  {/* Activity Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getSeverityColor(activity.severity)}`}>
                    {getActivityIcon(activity.activityType)}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.description}
                      </p>
                      <Badge variant={getSeverityVariant(activity.severity)} className="text-xs mr-2 flex-shrink-0">
                        {getSeverityLabel(activity.severity)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatActivityTime(activity.timestamp)}
                      </p>
                      
                      {activity.metadata && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          جزئیات
                        </Button>
                      )}
                    </div>

                    {/* Activity Metadata */}
                    {activity.metadata && (
                      <div className="mt-2 p-2 bg-persian-surface rounded text-xs text-muted-foreground">
                        <pre className="whitespace-pre-wrap font-mono">
                          {JSON.stringify(JSON.parse(activity.metadata), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${getSeverityColor(activity.severity)}`} />
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Activity Summary */}
        {displayActivities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-persian-error persian-numbers">
                  {displayActivities.filter(a => a.severity === 'critical').length}
                </div>
                <div className="text-xs text-muted-foreground">بحرانی</div>
              </div>
              <div>
                <div className="text-lg font-bold text-persian-warning persian-numbers">
                  {displayActivities.filter(a => a.severity === 'warning').length}
                </div>
                <div className="text-xs text-muted-foreground">هشدار</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-400 persian-numbers">
                  {displayActivities.filter(a => a.severity === 'info').length}
                </div>
                <div className="text-xs text-muted-foreground">اطلاع</div>
              </div>
              <div>
                <div className="text-lg font-bold text-persian-success persian-numbers">
                  {displayActivities.filter(a => a.activityType.includes('completed')).length}
                </div>
                <div className="text-xs text-muted-foreground">موفق</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
