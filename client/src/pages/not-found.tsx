import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">صفحه یافت نشد</CardTitle>
          <CardDescription className="text-gray-400">
            صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setLocation("/")}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
          >
            <Home className="w-4 h-4 mr-2" />
            بازگشت به صفحه اصلی
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
