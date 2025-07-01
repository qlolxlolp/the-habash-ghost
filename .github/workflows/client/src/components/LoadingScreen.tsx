import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Shield, Search, Radio, Waves } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    {
      icon: Cpu,
      text: "راه‌اندا��ی ماژول تشخیص شبکه...",
      duration: 2000,
    },
    {
      icon: Radio,
      text: "فعال‌سازی آنتن‌های RF برای تشخیص امواج ماینینگ...",
      duration: 1800,
    },
    {
      icon: Waves,
      text: "تحلیل طیف الکترومغناطیسی دستگاه‌های ماینر...",
      duration: 1600,
    },
    {
      icon: Search,
      text: "اسکن شبکه‌های محلی و اینترنتی ایلام...",
      duration: 1400,
    },
    {
      icon: Shield,
      text: "بارگذاری دیتابیس دستگاه‌های مشکوک تایید شده...",
      duration: 1200,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }

        // Update current step based on progress
        const stepIndex = Math.floor((newProgress / 100) * loadingSteps.length);
        if (stepIndex !== currentStep && stepIndex < loadingSteps.length) {
          setCurrentStep(stepIndex);
        }

        return newProgress;
      });
    }, 100); // 10 seconds total (100ms * 100 = 10000ms)

    return () => clearInterval(interval);
  }, [onComplete, currentStep, loadingSteps.length]);

  const CurrentIcon = loadingSteps[currentStep]?.icon || Cpu;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-persian-surface to-background flex items-center justify-center z-50">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(207, 90%, 54%) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, hsl(195, 90%, 54%) 0%, transparent 50%)`,
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-transparent border-t-primary border-r-persian-secondary rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-2 border-transparent border-b-persian-accent border-l-persian-warning rounded-full"
            />
            <div className="absolute inset-6 bg-primary rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-2">شبح حبشی</h1>
          <p className="text-lg text-muted-foreground">
            سامانه تشخیص و شناسایی دستگاه‌های استخراج ارز دیجیتال
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            ستاد مبارزه با جرائم سایبری استان ایلام • جمهوری اسلامی ایران
          </p>
        </motion.div>

        {/* Current Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4"
              >
                <CurrentIcon className="w-6 h-6 text-primary" />
              </motion.div>
              <div className="text-right">
                <p className="text-foreground font-medium">
                  {loadingSteps[currentStep]?.text || "در حال راه‌اندازی..."}
                </p>
                <p className="text-sm text-muted-foreground persian-numbers">
                  مرحله {currentStep + 1} از {loadingSteps.length}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>پیشرفت</span>
            <span className="persian-numbers">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-persian-surface-variant rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-persian-secondary rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Scanning Animation */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="h-1 bg-primary/60 rounded-full"
            />
          ))}
        </div>

        {/* Status Indicators */}
        <div className="flex justify-center space-x-reverse space-x-4 text-xs">
          <div className="flex items-center space-x-reverse space-x-2">
            <div className="w-2 h-2 bg-persian-success rounded-full animate-pulse" />
            <span className="text-muted-foreground">شبکه متصل</span>
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-muted-foreground">دیتابیس آماده</span>
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <div className="w-2 h-2 bg-persian-warning rounded-full animate-pulse" />
            <span className="text-muted-foreground">حسگرها فعال</span>
          </div>
        </div>
      </div>
    </div>
  );
}
