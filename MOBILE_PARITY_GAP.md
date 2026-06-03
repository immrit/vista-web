# Vista Web / Mobile Parity Gap

این سند وضعیت سازگاری نسخه وب با نسخه موبایل را ثبت می‌کند تا انتقال امکانات مرحله‌ای، قابل تست و قابل deploy باشد.

## انجام‌شده در این مرحله

- Auth وب از Supabase جدا شده و با `vista-backend` کار می‌کند.
- ورود/ثبت‌نام وب به flow موبایل نزدیک شده است: lookup identifier، OTP موبایل، password login، 2FA و refresh token.
- چت وب از backend API و WebSocket backend استفاده می‌کند.
- لینک گروه `https://cafevista.ir/group/{inviteCode}` صفحه اختصاصی وب دارد.
- صفحه لینک گروه روی موبایل تلاش می‌کند اپ را با `vista://group/{inviteCode}` باز کند.
- اگر اپ باز نشود، کاربر می‌تواند در وب login کند و با همان invite عضو گروه شود.
- Flutter deep link برای `vista://group/{inviteCode}`، `vista://post/{id}` و `vista://profile/{username}` هماهنگ شد.

## شکاف‌های مهم باقی‌مانده

### Chat / Groups

- وب هنوز مدیریت کامل گروه مثل موبایل ندارد: ساخت گروه، افزودن/حذف عضو، مدیریت admin، تغییر عکس/نام، فعال/غیرفعال کردن invite و regenerate invite.
- وب هنوز UI کامل جزئیات گروه، لیست اعضا و عملیات admin را ندارد.
- وب هنوز parity کامل با attachmentهای موبایل در چت ندارد: voice، فایل، media group، forward/reply پیشرفته، status دقیق ارسال/دریافت/خواندن.
- کش/offline چت وب با Isar/local queue موبایل قابل قیاس نیست.

### Stories

- نسخه موبایل story کامل دارد؛ وب فعلاً story creation/player/privacy/stickers/link/location/music parity ندارد.
- لینک‌ها و stickerهای story در وب باید بعد از API parity جداگانه منتقل شوند.

### Profile / Settings

- موبایل profile setup wizard، account details، privacy/security subpages و تنظیمات جزئی دارد؛ وب فعلاً فقط settings ساده و edit profile محدود دارد.
- تنظیمات مهم موبایل که باید به وب بیاید: group add privacy، notifications، appearance/theme، data/storage، privacy/security، session/security controls.

### Posts / Feed

- موبایل AddPost امکانات گسترده‌تر دارد: media picker، uploadهای متنوع، music/video/story-adjacent behavior، hashtag autocomplete و rich rendering.
- وب باید با مدل جدید پست موبایل برای tags، media، save، report، moderation و character limits کامل‌تر همسان شود.

### Search / QR / Deep Links

- موبایل QR scanner دارد و group invite را از QR join می‌کند؛ وب هنوز QR scanner ندارد.
- وب برای universal/app links صفحه landing دارد، ولی برای verified Android App Links و iOS Universal Links باید فایل‌های دامنه هم تنظیم شوند.

### Notifications / Sessions

- موبایل push/session manager کامل‌تر دارد؛ وب فقط بخشی از session و realtime را پوشش می‌دهد.
- پنل active sessions در وب هست، اما ثبت device/session وب باید با backend session API کامل‌تر شود.

### Payments / Premium

- موبایل Bazaar/payment flow و subscription UX خودش را دارد.
- وب payment callback و golden tick دارد، ولی parity با flow موبایل و وضعیت‌های subscription نیاز به audit جدا دارد.

## اولویت پیشنهادی انتقال

1. کامل‌سازی group/chat در وب: ساخت گروه، مدیریت اعضا، invite controls، details sheet.
2. profile setup واقعی در وب به جای redirect ساده به settings.
3. تنظیمات privacy/security و notification مطابق موبایل.
4. posts/feed parity: media، tags، save/report و محدودیت‌های نقش/اشتراک.
5. stories parity.
6. QR scanner و app/universal link verification فایل‌های دامنه.
7. session/device registration کامل برای وب.

## نکته deploy برای لینک گروه

لینک عمومی گروه باید همین فرم را نگه دارد:

```text
https://cafevista.ir/group/{inviteCode}
```

این مسیر در وب preview نشان می‌دهد و روی گوشی تلاش می‌کند اپ را با این لینک باز کند:

```text
vista://group/{inviteCode}
```

برای auto-open کامل بدون صفحه واسط، باید روی دامنه production فایل‌های Android Asset Links و Apple App Site Association هم تنظیم شوند. چون مقدار Android SHA-256 certificate fingerprint و Apple Team ID در repo نیست، این بخش باید در زمان release با اطلاعات واقعی signing انجام شود.
