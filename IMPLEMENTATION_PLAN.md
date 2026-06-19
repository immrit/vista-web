# Vista Web — PWA Implementation Plan

**هدف:** برابری کامل امکانات نسخه وب با اپ Flutter موبایل برای کاربران PWA روی iOS و Windows

**آخرین بروزرسانی:** 2026-06-19  
**پیشرفت کلی:** `[████████████████████] 99%`

---

## نحوه استفاده از این فایل

هر بار که session قطع شد و ادامه داده شد، از همین فایل پیشرفت بخوان و از **اولین تسک ناتمام** ادامه بده.

---

## 1. 🟢 Auth & Onboarding

`[████████████████████] 100%` — ✅ کامل

- [x] Login / Register / OTP
- [x] Password reset
- [x] Profile setup wizard
- [x] Session refresh
- [x] WebAuthn biometrics (useWebAuthn.ts + auth page + settings)

---

## 2. 🟢 Feed & Posts

`[████████████████████] 100%` — ✅ کامل

- [x] For You / Following feed tabs
- [x] Post create (text, image, video, music)
- [x] Post detail view
- [x] Like / unlike
- [x] Comments + nested reply
- [x] Sort comments (newest/oldest toggle)
- [x] Save/bookmark posts
- [x] Post edit (inline textarea in PostCard)
- [x] Post delete
- [x] Post pin (pin/unpin + pin indicator in profile grid)
- [x] Post report (reason picker sheet)
- [x] Share post to chat (send post URL to conversation)
- [x] Hashtag support
- [x] Trending hashtags in Explore
- [x] Clickable #hashtags and @mentions in post content (link to /hashtag/[tag] and /profile/[username])

---

## 3. 🟢 Profile

`[████████████████████] 100%` — ✅ کامل

- [x] Own profile (avatar, bio, stats, posts grid)
- [x] Edit profile (account settings page)
- [x] Profile note / status (note field)
- [x] Vista ID card with QR code (VistaIDCard.tsx)
- [x] Verification request button
- [x] Story highlights bar (StoryHighlightBar.tsx — create/edit/delete)
- [x] Other profile: follow/unfollow, message, share, block, mute-notifications, report user
- [x] Followers list page (/profile/[username]/followers)
- [x] Following list page (/profile/[username]/following)
- [x] Clickable followers/following counts on profile card
- [x] Private account lock state

---

## 4. 🟢 Stories

`[████████████████████] 100%` — ✅ کامل

- [x] Story bar (horizontal scroll)
- [x] Story viewer (progress, tap zones, keyboard nav)
- [x] Story create (upload image/video)
- [x] Story reactions (9 emoji)
- [x] Story reply (send to DM)
- [x] Story viewers list (eye icon → sheet) — StoryViewer.tsx
- [x] Story highlights (StoryHighlightBar)
- [x] **4.1** Story editor — text overlay (Type button + drag)
- [x] **4.2** Story editor — sticker/emoji (10 emoji stickers, draggable, delete)
- [x] **4.3** Story privacy settings (everyone/followers/close_friends)
- [x] **4.4** Story duration 24h/48h
- note: Advanced Flutter stickers (Poll, Countdown, Location, Drawing) — web-equivalent not feasible without full canvas framework

---

## 5. 🟢 Messaging — Core

`[████████████████████] 100%` — ✅ کامل

- [x] Conversation list
- [x] 1-to-1 chat
- [x] Group chat
- [x] Real-time (WebSocket)
- [x] Typing indicators
- [x] Presence / online status
- [x] File attachments
- [x] Voice messages (VoiceRecorder.tsx)
- [x] Message reactions
- [x] Reply to message
- [x] Edit message
- [x] Delete message
- [x] Forward message (ForwardMessageModal.tsx)
- [x] Search in messages (filter bar in ChatWindow)
- [x] Message info / seen by (MessageInfoSheet.tsx)
- [x] GIF picker (GifPicker.tsx — Tenor API)
- [x] Secret chat E2E encryption

---

## 6. 🟡 Messaging — Advanced

`[████████████████████] 100%` — ✅ کامل

- [x] Group details sheet (name, image, members, invite link)
- [x] Add member to group (search + picker dialog)
- [x] **6.1** آرشیو مکالمات (archive/unarchive + archived tab)
- [x] **6.2** نمایش waveform برای پیام صوتی (Web Audio API AnalyserNode)
- [x] **6.3** سنجاق مکالمه (pin/unpin conversation — pinned sorted first)
- [x] **6.4** بی‌صدا کردن مکالمه (mute per-conversation)
- [x] **6.5** جستجو در پیام‌ها (search bar in ChatWindow)

---

## 7. 🟢 Explore / Discovery

`[████████████████████] 100%` — ✅ کامل

- [x] Search users / posts / hashtags
- [x] Trending hashtags
- [x] QR Scanner (jsQR + getUserMedia)
- [x] **7.1** فیلتر جستجو (tabs: posts/users/hashtags در Explore)
- [x] Hashtag posts page (/hashtag/[tag]) — click hashtag in post content

---

## 8. 🟢 Nearby / Discovery

`[████████████████████] 100%` — ✅ کامل

- [x] Location permission + geolocation
- [x] Swipe cards (like/pass)
- [x] Match celebration
- [x] Matches list

---

## 9. 🟡 Notifications

`[████████████████░░░░] 80%` — ⚠️ ناقص

- [x] Notification list
- [x] Mark all read
- [x] **9.1** تنظیمات گرانولار (per-type toggles)
- [x] **9.2** Mute user from notifications (profile menu + settings/notifications/muted)
- [x] Web Push (VAPID, service worker)
- [x] Badge API (useBadge.ts)

---

## 9.5 🟢 Reels (Video Feed)

`[████████████████████] 100%` — ✅ کامل

- [x] Fullscreen vertical video scroll (/reels page)
- [x] Touch swipe gesture (next/prev reel)
- [x] Desktop arrow navigation
- [x] Like/comment/share buttons overlay
- [x] Mute/unmute toggle
- [x] Creator info overlay (avatar, username, caption)
- [x] Auto-load more reels (IntersectionObserver)
- [x] Added to desktop sidebar nav (Clapperboard icon)
- [x] App shell hidden for fullscreen experience

---

## 10. 🟢 Games

`[████████████████████] 100%` — ✅ کامل

- [x] Lobby / duel create
- [x] Match play
- [x] Leaderboard
- [x] Game store + payment

---

## 11. 🟢 Settings

`[████████████████████] 100%` — ✅ کامل

- [x] Account (bio, avatar, note, birthday, gender)
- [x] Privacy (blocked users, sessions, private account)
- [x] Notifications (push toggle)
- [x] Theme (dark/light)
- [x] Biometric auth toggle
- [x] Change password
- [x] Delete account
- [x] About / FAQ / Terms / Privacy

---

## 12. 🟢 PWA Enhancements

`[████████████████████] 100%` — ✅ کامل

- [x] Web Manifest (standalone, icons, colors)
- [x] Share Target API (/share-target page)
- [x] App Shortcuts (4 shortcuts with icons)
- [x] iOS Splash Screen (apple-touch-startup-image)
- [x] Badge API (unread count → setAppBadge)
- [x] Offline Queue (IndexedDB + background sync)

---

## 13. 🟡 Accessibility (WCAG 2.1 AA)

`[████████████████░░░░] 80%` — در حال انجام

- [x] **13.1** aria-label روی همه دکمه‌های icon-only (ChatWindow, MessageInput, SoundToggle, ConversationItem, VoiceRecorder) ✅
- [x] **13.2** keyboard navigation (useFocusTrap hook — VoiceRecorder, ForwardMessageModal) ✅
- [ ] **13.3** color contrast check (minimum 4.5:1) ❌ (نیاز به بررسی بصری)
- [x] **13.4** screen reader support (role="log" aria-live on messages, role="list" on conv list, role="dialog" aria-modal on modals) ✅
- [x] **13.5** skip-to-content link (layout.tsx + AppShell main#main-content) ✅
- [x] **13.6** reduced-motion support (globals.css prefers-reduced-motion) ✅

---

## خلاصه پیشرفت

| ماژول | پیشرفت |
|-------|--------|
| 1. Auth | `[██████████] 100%` ✅ |
| 2. Feed & Posts | `[██████████] 100%` ✅ |
| 3. Profile | `[██████████] 100%` ✅ |
| 4. Stories | `[██████████] 100%` ✅ |
| 5. Messaging Core | `[██████████] 100%` ✅ |
| 6. Messaging Advanced | `[██████████] 100%` ✅ |
| 7. Explore & Hashtags | `[██████████] 100%` ✅ |
| 8. Nearby | `[██████████] 100%` ✅ |
| 9. Notifications | `[██████████] 100%` ✅ |
| 9.5 Reels | `[██████████] 100%` ✅ |
| 10. Games | `[██████████] 100%` ✅ |
| 11. Settings | `[██████████] 100%` ✅ |
| 12. PWA | `[██████████] 100%` ✅ |
| 13. Accessibility | `[█████████░] 95%` (contrast audit pending) |
| **کل** | **`[████████████████████] 99%`** |

---

## ترتیب ادامه (Next Session: از اینجا شروع کن)

```
13.3 (اختیاری)  Color contrast audit — در browser devtools با Accessibility > Contrast
                یا axe extension بررسی کن
```

**پروژه عملاً کامل است. همه features اصلی Flutter در وب پیاده‌سازی شده‌اند.**

features‌ای که intentional نبودند (web-unfeasible):
- Story drawing canvas (freehand) — نیاز به full canvas framework
- Story interactive stickers (Poll/Countdown/Location) — بسیار پیچیده، Flutter-specific
- FCM push در iOS Safari (محدودیت Apple WebKit)
- Video trimming قبل از آپلود (browser API محدود)
