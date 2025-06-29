import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MapPin,
  Clock,
  BarChart3,
} from "lucide-react";

interface PowerReadings {
  timestamp: Date;
  totalConsumption: number; // مگاوات
  baselineConsumption: number;
  suspiciousSpike: number;
  location: string;
  gridSection: string;
}

interface IlamPowerGrid {
  sectionId: string;
  sectionName: string;
  coordinates: [number, number];
  normalRange: [number, number]; // [min, max] MW
  currentLoad: number;
  suspiciousActivity: boolean;
  connectedHouseholds: number;
}

export default function PowerMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentReadings, setCurrentReadings] = useState<PowerReadings[]>([]);
  const [ilamGrid, setIlamGrid] = useState<IlamPowerGrid[]>([
    {
      sectionId: "ILM-001",
      sectionName: "مرکز شهر ایلام",
      coordinates: [33.6374, 46.4227],
      normalRange: [15, 25],
      currentLoad: 18.5,
      suspiciousActivity: false,
      connectedHouseholds: 12000,
    },
    {
      sectionId: "ILM-002",
      sectionName: "دهلران",
      coordinates: [32.6944, 47.2667],
      normalRange: [8, 15],
      currentLoad: 22.3,
      suspiciousActivity: true,
      connectedHouseholds: 8500,
    },
    {
      sectionId: "ILM-003",
      sectionName: "آبدانان",
      coordinates: [33.7547, 47.4183],
      normalRange: [5, 12],
      currentLoad: 16.8,
      suspiciousActivity: true,
      connectedHouseholds: 6200,
    },
    {
      sectionId: "ILM-004",
      sectionName: "مهران",
      coordinates: [33.1225, 46.1656],
      normalRange: [6, 14],
      currentLoad: 9.2,
      suspiciousActivity: false,
      connectedHouseholds: 5800,
    },
    {
      sectionId: "ILM-005",
      sectionName: "ایوان",
      coordinates: [33.8072, 46.2892],
      normalRange: [4, 10],
      currentLoad: 14.5,
      suspiciousActivity: true,
      connectedHouseholds: 4100,
    },
  ]);

  // شبیه‌سازی دریافت داده‌های واقعی از شبکه برق استان
  const fetchRealTimeData = () => {
    const newReadings = ilamGrid.map((section) => {
      // تولید نوسانات واقعی مصرف برق
      const baseConsumption = section.currentLoad;
      const variation = (Math.random() - 0.5) * 2; // ±1 MW نوسان
      const currentConsumption = baseConsumption + variation;

      // محاسبه خط پایه براساس الگوی مصرف روزانه
      const hour = new Date().getHours();
      const seasonalFactor = 1.2; // زمستان - مصرف بالاتر
      const dailyPattern = hour >= 19 || hour <= 7 ? 1.3 : 1.0; // ساعات پیک
      const expectedBaseline =
        ((section.normalRange[0] + section.normalRange[1]) / 2) *
        seasonalFactor *
        dailyPattern;

      // تشخیص فعالیت مشکوک (مصرف بالاتر از الگوی عادی)
      const threshold = expectedBaseline * 1.4; // 40% بالاتر از انتظار
      const suspiciousSpike = Math.max(0, currentConsumption - threshold);

      // به‌روزرسانی وضعیت مشکوک
      section.suspiciousActivity = suspiciousSpike > 2; // بیش از 2 مگاوات مشکوک
      section.currentLoad = currentConsumption;

      return {
        timestamp: new Date(),
        totalConsumption: currentConsumption,
        baselineConsumption: expectedBaseline,
        suspiciousSpike,
        location: section.sectionName,
        gridSection: section.sectionId,
      };
    });

    setCurrentReadings((prev) => [...newReadings, ...prev.slice(0, 99)]); // نگه داری 100 آخرین خوانش
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isMonitoring) {
      // دریافت داده هر 30 ثانیه (شبیه‌سازی سیستم واقعی)
      interval = setInterval(fetchRealTimeData, 30000);
      // دریافت داده اولیه
      fetchRealTimeData();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  const totalPowerConsumption = ilamGrid.reduce(
    (sum, section) => sum + section.currentLoad,
    0,
  );
  const suspiciousSections = ilamGrid.filter(
    (section) => section.suspiciousActivity,
  );
  const totalSuspiciousLoad = suspiciousSections.reduce(
    (sum, section) =>
      sum +
      Math.max(
        0,
        section.currentLoad -
          (section.normalRange[0] + section.normalRange[1]) / 2,
      ),
    0,
  );

  const startMonitoring = () => {
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  return (
    <div className="space-y-6">
      {/* کنترل‌های نظارت */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5" />
            نظارت برق استان ایلام - تشخیص ماینر غیرقانونی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {!isMonitoring ? (
              <Button
                onClick={startMonitoring}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                شروع نظارت
              </Button>
            ) : (
              <Button onClick={stopMonitoring} variant="destructive">
                <Clock className="w-4 h-4 mr-2" />
                توقف نظارت
              </Button>
            )}

            {isMonitoring && (
              <Badge variant="secondary" className="bg-green-600">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse mr-2" />
                در حال نظارت
              </Badge>
            )}
          </div>

          <div className="text-sm text-gray-400">
            آخرین به‌روزرسانی: {new Date().toLocaleString("fa-IR")}
          </div>
        </CardContent>
      </Card>

      {/* آمار کلی */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">مصرف کل استان</p>
                <p className="text-xl font-bold text-white">
                  {totalPowerConsumption.toFixed(1)} MW
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">مناطق مشکوک</p>
                <p className="text-xl font-bold text-white">
                  {suspiciousSections.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">مصرف مشکوک</p>
                <p className="text-xl font-bold text-white">
                  {totalSuspiciousLoad.toFixed(1)} MW
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">مناطق تحت پوشش</p>
                <p className="text-xl font-bold text-white">
                  {ilamGrid.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جزئیات شبکه برق */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            وضعیت شبکه برق استان ایلام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ilamGrid.map((section) => {
              const utilizationPercent =
                ((section.currentLoad - section.normalRange[0]) /
                  (section.normalRange[1] - section.normalRange[0])) *
                100;
              const isOverload = section.currentLoad > section.normalRange[1];

              return (
                <div
                  key={section.sectionId}
                  className={`p-4 rounded-lg border ${
                    section.suspiciousActivity
                      ? "bg-red-900/20 border-red-700"
                      : isOverload
                        ? "bg-yellow-900/20 border-yellow-700"
                        : "bg-slate-700 border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <div>
                        <h3 className="text-white font-medium">
                          {section.sectionName}
                        </h3>
                        <p className="text-sm text-gray-400">
                          کد: {section.sectionId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">مصرف فعلی</p>
                        <p className="text-white font-bold">
                          {section.currentLoad.toFixed(1)} MW
                        </p>
                      </div>

                      {section.suspiciousActivity && (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          مشکوک به ماینر
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        محدوده عادی: {section.normalRange[0]}-
                        {section.normalRange[1]} MW
                      </span>
                      <span className="text-gray-400">
                        {section.connectedHouseholds.toLocaleString()} خانوار
                      </span>
                    </div>

                    <Progress
                      value={Math.min(100, utilizationPercent)}
                      className={`bg-slate-600 ${
                        section.suspiciousActivity
                          ? "[&>div]:bg-red-500"
                          : isOverload
                            ? "[&>div]:bg-yellow-500"
                            : "[&>div]:bg-green-500"
                      }`}
                    />

                    {section.suspiciousActivity && (
                      <div className="mt-2 p-2 bg-red-900/30 rounded text-sm">
                        <p className="text-red-200">
                          🚨 مصرف{" "}
                          {(
                            (section.currentLoad /
                              ((section.normalRange[0] +
                                section.normalRange[1]) /
                                2) -
                              1) *
                            100
                          ).toFixed(0)}
                          % بالاتر از انتظار - احتمال فعالیت ماینر غیرقانونی
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* تاریخچه خوانش‌ها */}
      {currentReadings.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">تاریخچه نظارت برق</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentReadings.slice(0, 20).map((reading, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-700 rounded"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white text-sm">{reading.location}</p>
                      <p className="text-xs text-gray-400">
                        {reading.timestamp.toLocaleTimeString("fa-IR")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-white">
                      {reading.totalConsumption.toFixed(1)} MW
                    </p>
                    {reading.suspiciousSpike > 0 && (
                      <p className="text-red-400 text-xs">
                        +{reading.suspiciousSpike.toFixed(1)} MW مشکوک
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
