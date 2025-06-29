import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  MapPin,
  Users,
  Database,
  Radio,
  Shield,
  Zap,
  AlertTriangle,
} from "lucide-react";
import DatabaseStatus from "@/components/DatabaseStatus";
import LiveMap from "@/components/LiveMap";
import DeviceList from "@/components/DeviceList";
import RealOwnerIdentification from "@/components/RealOwnerIdentification";
import RealNetworkScanner from "@/components/RealNetworkScanner";
import PowerMonitor from "@/components/PowerMonitor";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            سیستم تشخیص دستگاه‌های استخراج ارز دیجیتال
          </h1>
          <p className="text-center text-gray-300 text-lg">
            استان ایلام - سامانه نظارت و کنترل شبکه
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                دستگاه‌های شناسایی شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">47</div>
              <Badge variant="secondary" className="bg-blue-800 text-blue-100">
                فعال
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                مصرف برق کل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">1.2 MW</div>
              <Badge
                variant="secondary"
                className="bg-green-800 text-green-100"
              >
                بالا
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                هشدارهای امنیتی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">12</div>
              <Badge
                variant="destructive"
                className="bg-orange-800 text-orange-100"
              >
                نیاز به بررسی
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                وضعیت سیستم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">99%</div>
              <Badge
                variant="secondary"
                className="bg-purple-800 text-purple-100"
              >
                عملیاتی
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-7 bg-slate-800 border-slate-700">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-slate-700"
            >
              <Activity className="w-4 h-4 mr-2" />
              نمای کلی
            </TabsTrigger>
            <TabsTrigger
              value="network"
              className="data-[state=active]:bg-slate-700"
            >
              <Radio className="w-4 h-4 mr-2" />
              اسکن شبکه
            </TabsTrigger>
            <TabsTrigger
              value="power"
              className="data-[state=active]:bg-slate-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              نظارت برق
            </TabsTrigger>
            <TabsTrigger
              value="map"
              className="data-[state=active]:bg-slate-700"
            >
              <MapPin className="w-4 h-4 mr-2" />
              نقشه زنده
            </TabsTrigger>
            <TabsTrigger
              value="devices"
              className="data-[state=active]:bg-slate-700"
            >
              <Users className="w-4 h-4 mr-2" />
              لیست دستگاه‌ها
            </TabsTrigger>
            <TabsTrigger
              value="owner"
              className="data-[state=active]:bg-slate-700"
            >
              <Shield className="w-4 h-4 mr-2" />
              شناسایی مالک
            </TabsTrigger>
            <TabsTrigger
              value="database"
              className="data-[state=active]:bg-slate-700"
            >
              <Database className="w-4 h-4 mr-2" />
              پایگاه داده
            </TabsTrigger>
          </TabsList>

          <TabsContent value="network">
            <RealNetworkScanner />
          </TabsContent>

          <TabsContent value="power">
            <PowerMonitor />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">آخرین فعالیت‌ها</CardTitle>
                  <CardDescription className="text-gray-400">
                    فعالیت‌های اخیر سیستم نظارت
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-white">
                        دستگاه جدید شناسایی شد - IP: 192.168.1.45
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-white">
                        تغییر در مصرف برق - منطقه شرق ایلام
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-white">
                        هشدار امنیتی - فعالیت مشکوک شناسایی شد
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">وضعیت شبکه</CardTitle>
                  <CardDescription className="text-gray-400">
                    آمار کلی شبکه و دستگاه‌ها
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">دستگاه‌های آنلاین</span>
                      <span className="text-white font-bold">43/47</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">نرخ تشخیص</span>
                      <span className="text-white font-bold">98.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">متوسط مصرف برق</span>
                      <span className="text-white font-bold">25.6 kW</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">آخرین اسکن</span>
                      <span className="text-white font-bold">2 دقیقه پیش</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map">
            <LiveMap />
          </TabsContent>

          <TabsContent value="devices">
            <DeviceList />
          </TabsContent>

          <TabsContent value="owner">
            <RealOwnerIdentification />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
