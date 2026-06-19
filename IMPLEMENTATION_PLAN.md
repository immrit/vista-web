# Vista Web — PWA Implementation Plan

**هدف:** برابری کامل امکانات نسخه وب با اپ Flutter موبایل برای کاربران PWA روی iOS و Windows

**آخرین بروزرسانی:** 2026-06-19  
**پیشرفت کلی:** `[████████████████████] 100%`

---

## نحوه استفاده از این فایل

هر بار که session قطع شد و ادامه داده شد، از همین فایل پیشرفت بخوان و از **اولین تسک ناتمام** ادامه بده.

---

## 1. 🔴 Nearby / Discovery (اطراف من)

`[████████████████████] 100%` — ✅ کامل

---

## 2. 🔴 Group Chat Management

`[████████████████████] 100%` — ✅ کامل

- [x] **2.1-2.7** همه انجام شد (GroupDetailsSheet کامل)
- [x] **2.8** افزودن عضو جدید — member search/picker dialog ✅

---

## 3. 🔴 Message Enhancements

`[████████████████████] 100%` — ✅ کامل

- [x] **3.1-3.7** ✅
- [x] **3.5** فوروارد پیام (ForwardMessageModal) ✅
- [x] **3.8** جستجو در پیام‌ها (search bar in ChatWindow) ✅
- [x] **3.9-3.10** ✅
- [x] **3.11** GIF picker (Tenor API) ✅
- [x] **3.12** اطلاعات پیام (seen by list — MessageInfoSheet) ✅

---

## 4. 🟡 Story Enhancements

`[████████████████████] 100%` — ✅ کامل

- [x] **4.1-4.4** ✅
- [x] **4.5** استوری هایلایت (StoryHighlightBar + create/edit/delete) ✅
- [x] **4.6** Editor استوری (text overlay، sticker) ✅
- [x] **4.7** نمایش بازدیدکنندگان استوری ✅ (swipe up در StoryViewer)
- [x] **4.8** واکنش به استوری (9 ایموجی) ✅
- [x] **4.9** استوری 24h/48h بر اساس اشتراک ✅

---

## 5. 🟡 Post Enhancements

`[████████████████████] 100%` — ✅ کامل

- [x] **5.1-5.5** ✅
- [x] **5.6** ویرایش پست (inline edit در PostCard) ✅
- [x] **5.7** ریپلای کامنت (nested) ✅ (موجود بود)
- [x] **5.8** مرتب‌سازی کامنت‌ها (sort toggle در CommentSheet) ✅
- [x] **5.9** گزارش پست با انتخاب دلیل (ReportSheet در PostMenu) ✅
- [x] **5.10** محدودیت کاراکتر ✅
- [x] **5.11** اشتراک‌گذاری پست به چت (ShareToChat در PostMenu) ✅
- [x] **5.12** پست pinned در پروفایل (pin/unpin in PostMenu + pin indicator in grid) ✅

---

## 6. 🟡 Profile Completeness

`[████████████████████] 90%` — ⚠️ ناقص

- [x] **6.1-6.8** ✅
- [x] **6.9** یادداشت پروفایل (note field در settings) ✅
- [x] **6.10** Vista ID card با QR کد (VistaIDCard component) ✅
- [x] **6.11** دکمه ارسال درخواست تیک تأیید ✅
- [x] **6.12** پروفایل‌های دیگران — share, block, report user ✅

---

## 7. 🟢 Web Push Notifications (PWA)

`[████████████████████] 100%` — ✅ کامل

---

## 8. 🟢 WebAuthn / Biometric Auth

`[████████████████████] 100%` — ✅ کامل

- [x] **8.1** registerWebAuthn (webAuthn.ts)
- [x] **8.2** authenticateWebAuthn
- [x] **8.3** دکمه ورود بیومتریک در auth page
- [x] **8.4** تنظیمات فعال/غیرفعال در settings page
- [x] **8.5** fallback به رمز عبور

---

## 9. 🟢 QR Code Scanner

`[████████████████████] 100%` — ✅ کامل

---

## 10. 🟢 Language Toggle (fa / en)

`[████████████████████] 100%` — ✅ کامل

- [x] **10.1-10.2** RTL + جلالی ✅
- [x] **10.3-10.6** i18n کامل ✅

---

## 11. 🔵 Notification Settings Advanced

`[████████████████████] 100%` — ✅ کامل

- [x] **11.1-11.3** push + message + DND ✅
- [x] **11.4-11.5** granular filter + mute user ✅

---

## 12. 🔵 PWA Enhancements

`[████████████████████] 100%` — ✅ کامل

- [x] **12.1-12.3** ✅
- [x] **12.4** Share Target API (manifest.json + /share-target page) ✅
- [x] **12.5** App Shortcuts with icons ✅
- [x] **12.6** iOS Splash Screen (apple-touch-startup-image) ✅
- [x] **12.7** Badge API (useBadge hook → unread count) ✅
- [x] **12.8** Background Sync (useOfflineQueue + IndexedDB) ✅

---

## 13. 🔵 Accessibility (WCAG 2.1 AA)

`[████████████████████] 100%` — ✅ کامل

---

## خلاصه پیشرفت کلی

| ماژول | پیشرفت |
|-------|--------|
| 1. Nearby / Discovery | `[██████████] 100%` ✅ |
| 2. Group Chat | `[██████████] 100%` ✅ |
| 3. Message Enhancements | `[██████████] 100%` ✅ |
| 4. Story Enhancements | `[██████████] 100%` ✅ |
| 5. Post Enhancements | `[██████████] 100%` ✅ |
| 6. Profile Completeness | `[██████████] 100%` ✅ |
| 7. Web Push Notifications | `[██████████] 100%` ✅ |
| 8. WebAuthn / Biometric | `[██████████] 100%` ✅ |
| 9. QR Code Scanner | `[██████████] 100%` ✅ |
| 10. Language Toggle | `[██████████] 100%` ✅ |
| 11. Notification Settings | `[██████████] 100%` ✅ |
| 12. PWA Enhancements | `[██████████] 100%` ✅ |
| 13. Accessibility | `[██████████] 100%` ✅ |
| **کل** | **`[████████████████████] 100%`** |

---

## ترتیب ادامه (Next Session: از اینجا شروع کن)

```
✅ = تمام
❌ = شروع نشده

همه تسک‌ها با موفقیت تکمیل شدند! 🎉
```
