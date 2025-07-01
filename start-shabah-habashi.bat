@echo off
chcp 65001 > nul
cls

echo ============================================
echo     شبح حبشی - Shabah Habashi
echo ============================================
echo Copyright © Erfan Rajabee - بهار 1404
echo ایران، ایلام
echo ============================================
echo.

echo 🚀 شروع راه‌اندازی شبح حبشی...
echo.

REM بررسی وجود فایل اجرایی
if not exist "shabah-habashi.exe" (
    echo ❌ خطا: فایل shabah-habashi.exe یافت نشد!
    echo لطفاً مطمئن شوید فایل در همین فولدر قرار دارد.
    pause
    exit /b 1
)

REM بررسی وجود فولدر public
if not exist "public" (
    echo ❌ خطا: فولدر public یافت نشد!
    echo لطفاً فولدر public را در همین مکان قرار دهید.
    pause
    exit /b 1
)

echo ✅ فایل‌های لازم یافت شدند
echo.

echo 🌐 راه‌اندازی سرور...
echo.
echo 👤 اطلاعات ورود:
echo    نام کاربری: qwerty
echo    رمز عبور: azerty
echo.
echo 📍 آدرس: http://localhost:5000
echo.
echo برای توقف برنامه Ctrl+C فشار دهید
echo ============================================
echo.

REM اجرای برنامه
"shabah-habashi.exe"

echo.
echo برنامه متوقف شد.
pause
