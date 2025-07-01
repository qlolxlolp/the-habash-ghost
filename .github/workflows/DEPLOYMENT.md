# راهنمای Deployment - شبح حبشی

## اطلاعات پروژه

- **نام:** شبح حبشی
- **توسعه‌دهنده:** Erfan Rajabee
- **تاریخ:** بهار 1404 - ایران، ایلام
- **حقوق:** © تمامی حقوق محفوظ است

## نیازمندی‌های سیستم

- Node.js >= 18.0.0
- npm >= 8.0.0
- حافظه: حداقل 512MB RAM
- فضای ذخیره: حداقل 1GB

## مراحل Deployment

### 1. نصب Dependencies

```bash
npm install
```

### 2. Build کردن پروژه

```bash
npm run build
```

### 3. تنظیم Environment Variables

```bash
export NODE_ENV=production
export SESSION_SECRET="erfan_rajabee_shabah_habashi_secret_key_2024"
export DATABASE_URL="postgresql://user:password@localhost:5432/shabah_habashi"
```

### 4. اجرای Production Server

```bash
npm start
```

## پورت‌ها

- **Production:** 5000
- **Development:** 5000

## اطلاعات ورود پیش‌فرض

- **نام کاربری:** qwerty
- **رمز عبور:** azerty

## فایل‌های مهم

- `dist/index.js` - Backend production build
- `dist/public/` - Frontend production build
- `package.json` - Dependencies و scripts
- `deploy.sh` - اسکریپت deployment

## عملکرد

- سیستم authentication با session
- In-memory storage برای development
- PostgreSQL support برای production
- WebSocket برای real-time updates

## امنیت

- Session-based authentication
- Password hashing با scrypt
- Input validation با Zod
- CSRF protection

## نظارت و Logs

- Application logs در console
- Error handling و reporting
- Performance monitoring

## پشتیبانی

برای پشتیبانی و راهنمایی با توسعه‌دهنده تماس بگیرید.

---

**شبح حبشی** - سامانه تشخیص و شناسایی دستگاه‌های استخراج ارز دیجیتال

© Erfan Rajabee - بهار 1404 - ایران، ایلام
