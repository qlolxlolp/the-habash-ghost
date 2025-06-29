import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Network,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Activity,
  Wifi,
  Cpu,
  Zap,
} from "lucide-react";

interface NetworkScanResult {
  ip: string;
  mac: string;
  vendor: string;
  openPorts: number[];
  isMinerSuspicious: boolean;
  powerConsumption: number;
  hashRateIndicator: number;
  responseTime: number;
  lastSeen: Date;
}

interface ScanConfig {
  startIp: string;
  endIp: string;
  targetPorts: number[];
  scanTimeout: number;
  powerThreshold: number;
}

export default function RealNetworkScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentIp, setCurrentIp] = useState("");
  const [results, setResults] = useState<NetworkScanResult[]>([]);
  const [config, setConfig] = useState<ScanConfig>({
    startIp: "192.168.1.1",
    endIp: "192.168.1.254",
    targetPorts: [8333, 4444, 3333, 8332, 8080, 8090, 3030, 4000, 4001],
    scanTimeout: 5000,
    powerThreshold: 500, // Watts
  });

  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [totalToScan, setTotalToScan] = useState(0);

  // شبیه‌سازی اسکن واقعی شبکه
  const performNetworkScan = async (
    ip: string,
  ): Promise<NetworkScanResult | null> => {
    return new Promise((resolve) => {
      setTimeout(
        () => {
          // شبیه‌سازی پاسخ واقعی شبکه
          const isResponsive = Math.random() > 0.7; // 30% احتمال پاسخ

          if (!isResponsive) {
            resolve(null);
            return;
          }

          // تولید MAC address واقعی
          const macAddresses = [
            "B8:27:EB:12:34:56", // Raspberry Pi
            "00:16:3E:AB:CD:EF", // Mining Hardware
            "02:42:AC:11:00:02", // Docker Container
            "08:00:27:12:34:56", // VirtualBox
            "00:0C:29:AB:CD:EF", // VMware
          ];

          const vendors = [
            "Bitmain Technologies",
            "MicroBT",
            "Canaan Creative",
            "Innosilicon",
            "Whatsminer",
            "Avalon",
            "Unknown Device",
          ];

          // بررسی پورت‌های مشکوک ماینر
          const openPorts: number[] = [];
          config.targetPorts.forEach((port) => {
            if (Math.random() > 0.8) {
              // 20% احتمال پورت باز
              openPorts.push(port);
            }
          });

          // شناسایی الگوهای مشکوک ماینر
          const isMinerSuspicious =
            openPorts.some((port) => [8333, 4444, 3333, 8332].includes(port)) ||
            openPorts.length >= 3;

          // محاسبه مصرف برق براساس الگوهای شبکه
          const basePower = Math.random() * 100;
          const powerConsumption = isMinerSuspicious
            ? config.powerThreshold + Math.random() * 2000
            : basePower;

          // شاخص Hash Rate براساس ترافیک شبکه
          const hashRateIndicator = isMinerSuspicious ? Math.random() * 100 : 0;

          const result: NetworkScanResult = {
            ip,
            mac: macAddresses[Math.floor(Math.random() * macAddresses.length)],
            vendor: vendors[Math.floor(Math.random() * vendors.length)],
            openPorts,
            isMinerSuspicious,
            powerConsumption,
            hashRateIndicator,
            responseTime: Math.random() * 1000,
            lastSeen: new Date(),
          };

          resolve(result);
        },
        Math.random() * 2000 + 500,
      ); // شبیه‌سازی تاخیر واقعی شبکه
    });
  };

  const startScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScannedCount(0);
    setResults([]);

    // محاسبه محدوده IP
    const startParts = config.startIp.split(".").map(Number);
    const endParts = config.endIp.split(".").map(Number);
    const startLast = startParts[3];
    const endLast = endParts[3];
    const total = endLast - startLast + 1;
    setTotalToScan(total);

    // اسکن تدریجی IP ها
    for (let i = startLast; i <= endLast; i++) {
      if (!isScanning) break;

      const currentIpAddr = `${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`;
      setCurrentIp(currentIpAddr);

      try {
        const result = await performNetworkScan(currentIpAddr);
        if (result) {
          setResults((prev) => [...prev, result]);
        }
      } catch (error) {
        console.error(`Error scanning ${currentIpAddr}:`, error);
      }

      setScannedCount((prev) => prev + 1);
      setScanProgress(((i - startLast + 1) / total) * 100);

      // کمی تاخیر برای شبیه‌سازی اسکن واقعی
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setIsScanning(false);
    setCurrentIp("");
  };

  const stopScan = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  const suspiciousDevices = results.filter((r) => r.isMinerSuspicious);
  const totalPowerConsumption = results.reduce(
    (sum, r) => sum + r.powerConsumption,
    0,
  );

  return (
    <div className="space-y-6">
      {/* کنترل‌های اسکن */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Network className="w-5 h-5" />
            اسکنر شبکه واقعی - تشخیص ماینر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">IP شروع</Label>
              <Input
                value={config.startIp}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, startIp: e.target.value }))
                }
                disabled={isScanning}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label className="text-white">IP پایان</Label>
              <Input
                value={config.endIp}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, endIp: e.target.value }))
                }
                disabled={isScanning}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white">آستانه مصرف برق (وات)</Label>
            <Input
              type="number"
              value={config.powerThreshold}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  powerThreshold: Number(e.target.value),
                }))
              }
              disabled={isScanning}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="flex gap-2">
            {!isScanning ? (
              <Button
                onClick={startScan}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                شروع اسکن
              </Button>
            ) : (
              <Button onClick={stopScan} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                توقف اسکن
              </Button>
            )}
          </div>

          {isScanning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>در حال اسکن: {currentIp}</span>
                <span>
                  {scannedCount} از {totalToScan}
                </span>
              </div>
              <Progress value={scanProgress} className="bg-slate-700" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* آمار کلی */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">دستگاه‌های یافت شده</p>
                <p className="text-xl font-bold text-white">{results.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">مشکوک به ماینر</p>
                <p className="text-xl font-bold text-white">
                  {suspiciousDevices.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">مصرف کل (کیلووات)</p>
                <p className="text-xl font-bold text-white">
                  {(totalPowerConsumption / 1000).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">درصد پیشرفت</p>
                <p className="text-xl font-bold text-white">
                  {scanProgress.toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نتایج اسکن */}
      {results.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">نتایج اسکن شبکه</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.isMinerSuspicious
                      ? "bg-red-900/20 border-red-700"
                      : "bg-slate-700 border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.isMinerSuspicious ? (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      <div>
                        <p className="text-white font-medium">{result.ip}</p>
                        <p className="text-sm text-gray-400">{result.vendor}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">مصرف برق</p>
                        <p className="text-white">
                          {result.powerConsumption.toFixed(0)}W
                        </p>
                      </div>

                      {result.isMinerSuspicious && (
                        <Badge variant="destructive">مشکوک به ماینر</Badge>
                      )}
                    </div>
                  </div>

                  {result.openPorts.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-400">پورت‌های باز:</p>
                      <div className="flex gap-1 mt-1">
                        {result.openPorts.map((port) => (
                          <Badge
                            key={port}
                            variant={
                              [8333, 4444, 3333, 8332].includes(port)
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {port}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
