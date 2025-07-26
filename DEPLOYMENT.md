# راهنمای استقرار Vista Web

## 🚀 برای chabokan.net

### مراحل استقرار

1. **آپلود پروژه:**
   - فایل‌های پروژه را در chabokan.net آپلود کنید
   - یا از Git repository متصل کنید

2. **تنظیم متغیرهای محیطی:**
   در پنل مدیریت chabokan.net این متغیرها را تنظیم کنید:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NODE_ENV=production
   ```

3. **Build و Deploy:**
   پلتفرم خودکار این مراحل را انجام می‌دهد:

   ```bash
   npm install
   npm run build
   npm start
   ```

## 🖥️ برای Windows (Local)

### روش 1: PowerShell Script

```powershell
.\build-production.ps1
```

### روش 2: Manual

```powershell
# پاک کردن
Remove-Item -Recurse -Force node_modules, .next, package-lock.json -ErrorAction SilentlyContinue

# نصب
npm install

# build
npm run build

# اجرا
npm start
```

## 🐧 برای Linux/Mac

### روش 1: Bash Script

```bash
chmod +x build-clean.sh
./build-clean.sh
```

### روش 2: Manual

```bash
# پاک کردن
rm -rf node_modules .next package-lock.json

# نصب
npm install

# build
npm run build

# اجرا
npm start
```

## 🔧 عیب‌یابی

### مشکل: "Unexpected end of JSON input"

**راه حل:**

1. پاک کردن کامل:

   ```bash
   rm -rf node_modules .next package-lock.json
   npm install
   ```

### مشکل: "next: not found"

**راه حل:**

1. استفاده از npx:

   ```bash
   npx next build
   ```

### مشکل: TypeScript errors

**راه حل:**

1. بررسی Node.js version (>= 18.0.0)
2. نصب مجدد dependencies
3. بررسی tsconfig.json

### مشکل: ESLint errors

**راه حل:**

1. تنظیم `ignoreDuringBuilds: true` در next.config.ts
2. یا اصلاح ESLint errors

## 📋 چک‌لیست قبل از deployment

- [ ] Node.js >= 18.0.0
- [ ] npm >= 8.0.0
- [ ] متغیرهای محیطی تنظیم شده
- [ ] فایل‌های .env.local موجود
- [ ] build موفق
- [ ] start موفق

## 🌐 ویژگی‌های پلتفرم

### chabokan.net

- ✅ **Auto-build**: خودکار build می‌کند
- ✅ **SSL/HTTPS**: خودکار فعال است
- ✅ **CDN**: برای سرعت بیشتر
- ✅ **Auto-restart**: در صورت crash
- ✅ **Monitoring**: لاگ‌ها و آمار
- ✅ **Environment Variables**: در پنل مدیریت

### سایر پلتفرم‌ها

- PM2 برای process management
- Nginx برای reverse proxy
- Docker برای containerization

## 📞 پشتیبانی

برای مشکلات:

1. لاگ‌های build را بررسی کنید
2. متغیرهای محیطی را چک کنید
3. از پشتیبانی پلتفرم کمک بگیرید
4. فایل‌های README.md و DEPLOYMENT.md را مطالعه کنید
