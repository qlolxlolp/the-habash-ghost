import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(formData.username, formData.password);
      setLocation("/"); // Navigate on successful login
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ورود به سیستم");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800 border-slate-700 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl text-white font-bold">
              شبح حبشی
            </CardTitle>
            <CardDescription className="text-gray-400">
              سامانه تشخیص و شناسایی دستگاه‌های استخراج ارز دیجیتال
              <br />
              ستاد مبارزه با جرائم سایبری استان ایلام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-900 border-red-800"
                >
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-white flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  نام کاربری
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                  placeholder="نام کاربری خود را وارد کنید"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-white flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  رمز عبور
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                  placeholder="رمز عبور خود را وارد کنید"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3"
                disabled={isLoading}
              >
                {isLoading ? "در حال ورود..." : "ورود به سیستم"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Copyright Footer */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-gray-400 text-sm">
            © تمامی حق��ق محفوظ است برای Erfan Rajabee
          </p>
          <p className="text-gray-500 text-xs">
            این نرم‌افزار تحت حمایت قوانین کپی‌رایت جمهوری اسلامی ایران می‌باشد
          </p>
          <p className="text-gray-500 text-xs font-bold">
            بهار 1404 - ایران، ایلام
          </p>
        </div>
      </div>
    </div>
  );
}
