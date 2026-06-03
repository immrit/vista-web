# راهنمای دیپلوی Vista روی سرور (cafevista.ir)

این راهنما برای دیپلوی سه سرویس اصلی است:

- `vista-backend` روی پورت `8080`
- `vista-manager` روی پورت `3001`
- `vista-web` روی پورت `3000`

## دامنه‌ها

| دامنه | سرویس |
|-------|-------|
| `cafevista.ir` | وب (این پروژه) |
| `api.coffevista.ir` | بک‌اند API |
| `manager.coffevista.ir` | پنل مدیریت |

## 1. پیش‌نیاز سرور

روی سرور Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git ufw nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker version
docker compose version
```

DNS دامنه‌ها را به IP سرور وصل کن:

- `cafevista.ir` برای وب
- `www.cafevista.ir` برای وب (ریدایرکت)
- `api.coffevista.ir` برای بک‌اند  
- `manager.coffevista.ir` برای پنل مدیریت

فایروال پیشنهادی:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```


در production پورت‌های دیتابیس مثل `5432`، `6379` و `9042` را عمومی نکن. اگر compose بک‌اند این پورت‌ها را publish می‌کند، یا از firewall ببندشان یا publishها را برای production بردار.

## 2. دیپلوی بک‌اند

```bash
cd /opt
git clone <BACKEND_REPO_URL> vista-backend
cd /opt/vista-backend
cp .env.example .env
nano .env
```

مقادیر حساس را واقعی و امن کن:

- `AUTH_JWT_SECRET`
- `POSTGRES_PASSWORD`
- `ARVAN_ACCESS_KEY`
- `ARVAN_SECRET_KEY`
- `SMS_IR_API_KEY`
- کلیدهای SMTP/Telegram در صورت استفاده

اگر secretها قبلاً داخل فایل‌های لوکال یا خروجی compose دیده شده‌اند، روی سرور مقدار جدید بساز و rotate کن.

سپس:

```bash
docker compose --env-file .env up -d --build
docker compose ps
curl http://127.0.0.1:8080/healthz
```

## 3. دیپلوی پنل مدیریت

```bash
cd /opt
git clone <MANAGER_REPO_URL> vista-manager
cd /opt/vista-manager
cp .env.production.example .env.production
nano .env.production
```

مقادیر مهم:

```env
BACKEND_URL=http://host.docker.internal:8080
NEXT_PUBLIC_BACKEND_URL=https://api.coffevista.ir
```

سپس:

```bash
docker compose --env-file .env.production up -d --build
```

## 4. دیپلوی وب

```bash
cd /opt
git clone <WEB_REPO_URL> vista-web
cd /opt/vista-web
cp .env.production.example .env.production
nano .env.production
```

مقادیر اصلی:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.coffevista.ir
NEXT_PUBLIC_APP_URL=https://coffevista.ir
NEXT_PUBLIC_APP_VERSION=2.5.0
JWT_SECRET=<حداقل 32 کاراکتر>
ENCRYPTION_KEY=<دقیقاً 32 کاراکتر>
CSRF_SECRET=<حداقل 32 کاراکتر>
VISTA_WEB_PORT=3000
```

برای Next.js، متغیرهای `NEXT_PUBLIC_*` داخل bundle کلاینت bake می‌شوند. بنابراین اگر دامنه API یا وب را عوض کردی، حتماً image را دوباره build کن:

```bash
docker compose --env-file .env.production up -d --build
docker compose ps
curl http://127.0.0.1:3000
```

## 5. تنظیم Reverse Proxy

با Nginx Proxy Manager یا Nginx معمولی:

- `api.coffevista.ir` -> `http://SERVER_IP:8080`
- `coffevista.ir` -> `http://SERVER_IP:3000`
- `manager.coffevista.ir` -> `http://SERVER_IP:3001`

برای `api.coffevista.ir` حتماً WebSocket support را فعال کن، چون چت از مسیر `/v1/chat/ws` استفاده می‌کند.

SSL را با Let’s Encrypt فعال کن و گزینه‌های زیر را روشن کن:

- Force SSL
- HTTP/2
- WebSocket Support برای API

## 6. آپدیت بعدی

برای هر سرویس:

```bash
cd /opt/vista-web
git pull
docker compose --env-file .env.production up -d --build
docker image prune -f
```

برای بک‌اند:

```bash
cd /opt/vista-backend
git pull
docker compose --env-file .env up -d --build
docker compose logs -f api
```

## 7. چک‌لیست نهایی

- `https://api.coffevista.ir/healthz` پاسخ سالم بدهد.
- `https://coffevista.ir` صفحه وب را باز کند.
- لاگین در وب توکن `access_token` بگیرد.
- ساخت پست و آپلود media از طریق presign بک‌اند کار کند.
- چت WebSocket پشت reverse proxy قطع نشود.
- دیتابیس‌ها از اینترنت مستقیم قابل دسترسی نباشند.

## 8. رفع خطای `.next` و chunk گمشده

اگر در dev یا production خطایی مثل زیر دیدی:

```text
Error: Cannot find module './548.js'
Require stack:
... .next/server/webpack-runtime.js
```

به احتمال زیاد build output قدیمی یا نیمه‌ساخته باقی مانده است. روی سرور یا لوکال:

```bash
rm -rf .next
npm run build
npm run start
```

در Docker:

```bash
docker compose --env-file .env.production build --no-cache vista-web
docker compose --env-file .env.production up -d vista-web
docker compose logs -f vista-web
```

## 9. لینک دعوت گروه

لینک دعوت گروه باید این فرم را داشته باشد:

```text
https://cafevista.ir/group/{inviteCode}
```

این صفحه در وب preview گروه را با endpoint عمومی بک‌اند می‌گیرد و روی موبایل تلاش می‌کند اپ را با این scheme باز کند:

```text
vista://group/{inviteCode}
```

برای auto-open کامل Android App Links و iOS Universal Links بدون صفحه واسط، در production باید Android SHA-256 signing fingerprint و Apple Team ID را داشته باشی و سپس این دو فایل دامنه را با مقادیر واقعی release تنظیم کنی:

- `https://cafevista.ir/.well-known/assetlinks.json`
- `https://cafevista.ir/.well-known/apple-app-site-association`
