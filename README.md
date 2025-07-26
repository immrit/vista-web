# Vista Web

پلتفرم اجتماعی Vista با Next.js 15 و TypeScript

## 🚀 ویژگی‌ها

- ✅ Next.js 15 App Router
- ✅ TypeScript
- ✅ Tailwind CSS 4
- ✅ Supabase Integration
- ✅ PWA Support
- ✅ RTL Support (فارسی)
- ✅ Responsive Design

## 📋 پیش‌نیازها

- Node.js >= 18.0.0
- npm >= 8.0.0

## 🛠️ نصب و راه‌اندازی

### 1. نصب dependencies

```bash
npm install
```

### 2. تنظیم متغیرهای محیطی

فایل `.env.local` را ایجاد کنید:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. اجرای development

```bash
npm run dev
```

### 4. build برای production

```bash
npm run build
npm start
```

## 🐳 برای Windows

از اسکریپت PowerShell استفاده کنید:

```powershell
.\build-production.ps1
```

## 🌐 برای chabokan.net

1. فایل‌های پروژه را آپلود کنید
2. متغیرهای محیطی را در پنل تنظیم کنید
3. پلتفرم خودکار build و start را انجام می‌دهد

## 📁 ساختار پروژه

```
src/
├── app/                 # App Router pages
│   ├── auth/           # Authentication pages
│   ├── feed/           # Feed page
│   ├── profile/        # Profile pages
│   └── layout.tsx      # Root layout
├── components/         # React components
│   └── ui/            # UI components
├── lib/               # Utilities and configs
│   ├── supabase.ts    # Supabase client
│   └── types.ts       # TypeScript types
└── hooks/             # Custom React hooks
```

## 🔧 تنظیمات

### Next.js Config

- PWA support
- Image optimization
- ESLint configuration

### Tailwind CSS

- RTL support
- Custom fonts (Vazirmatn, Bauhaus)
- Dark mode

### TypeScript

- Strict mode
- Path aliases (@/*)
- Next.js types

## 🚀 Deployment

### chabokan.net

پروژه برای chabokan.net بهینه شده است:

- ✅ Auto-build
- ✅ SSL/HTTPS
- ✅ CDN
- ✅ Auto-restart

### سایر پلتفرم‌ها

```bash
npm run build
npm start
```

## 📞 پشتیبانی

برای مشکلات و سوالات:

1. لاگ‌های build را بررسی کنید
2. متغیرهای محیطی را چک کنید
3. از پشتیبانی پلتفرم کمک بگیرید
