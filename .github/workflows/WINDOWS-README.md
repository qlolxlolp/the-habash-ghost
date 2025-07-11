# شبح حبشی - راهنمای اجرا در ویندوز

## معرفی

**شبح حبشی** - سامانه تشخیص و شناسایی دستگاه‌های استخراج ارز دیجیتال

**توسعه‌دهنده:** Erfan Rajabee  
**تاریخ:** بهار 1404 - ایران، ایلام  
**حقوق:** © تمامی حقوق محفوظ است

## فایل‌های مورد نیاز

### فایل اجرایی اصلی:

- `shabah-habashi.exe` (حدود 40 مگابایت)

### فولدر وب سایت:

- `public/` (شامل فایل‌های رابط کاربری)

## نحوه راه‌اندازی

### گام 1: آماده‌سازی

1. فایل `shabah-habashi.exe` را در یک فولدر قرار دهید
2. فولدر `public` ��ا در همان مکان کپی کنید
3. مطمئن شوید که Windows Defender یا آنتی‌ویروس فایل را مسدود نکرده باشد

### گام 2: اجرا

1. روی فایل `shabah-habashi.exe` دابل کلیک کنید
2. Windows ممکن است هشدار امنیتی نمایش دهد - گزینه "Run anyway" را انتخاب کنید
3. منتظر بمانید تا پیام "شبح حبشی در حال اجرا روی پورت 5000" نمایش داده شود

### گام 3: دسترسی

1. مرورگر وب خود را باز کنید
2. آدرس `http://localhost:5000` را وارد کنید
3. صفحه ورود نمایش داده می‌شود

## اطلاعات ورود

- **نام کاربری:** qwerty
- **رمز عبور:** azerty

## ویژگی‌های فعال

- 🌐 اسکن شبکه
- 📍 ردیابی مکان GPS
- 👤 شناسایی مالک
- 🗺️ نقشه زنده
- 💾 پایگاه داده

## متطلبات سیستم

- **سیستم عامل:** Windows 7/8/10/11 (64-bit)
- **حافظه:** حداقل 512 MB RAM
- **فضای خالی:** حداقل 100 MB
- **اتصال اینترنت:** برای عملکرد کامل

## عیب‌یابی

### مشکل: فایل اجرا نمی‌شود

- Windows Defender را چک کنید
- ف��یل را از قرنطینه خارج کنید
- با کلیک راست "Run as administrator" انتخاب کنید

### مشکل: صفحه باز نمی‌شود

- مطمئن شوید که پورت 5000 آزاد است
- برنامه‌های آنتی‌ویروس را موقتاً غیرفعال کنید
- فایروال Windows را بررسی کنید

### مشکل: فولدر public یافت نمی‌شود

- مطمئن شوید فولدر `public` در کنار فایل exe قرار دارد
- مسیر را بررسی کنید

## ساختار فایل‌ها

```
├── shabah-habashi.exe
└── public/
    ├── index.html
    └── assets/
        ├── index.css
        └── index.js
```

## توقف برنامه

- پنجره Command Prompt را ببندید
- یا Ctrl+C فشار دهید

## پشتیبانی

برای پشتیبانی فنی و راهنمایی بیشتر با توسعه‌دهنده تماس بگیرید.

---

**شبح حبشی** - ابزار تشخیص و شناسایی دستگاه‌های استخراج ارز دیجیتال

© Erfan Rajabee - بهار 1404 - ایران، ایلام  
تمامی حقوق محفوظ است
