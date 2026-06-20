# Vista Quiz — Roadmap & Progress

Living tracker for the game section (ویستا کوییز). Updated after each change.
Progress bars are coarse estimates. `[██████████]` = 10 cells = 100%.

**Overall: `[████████░░] ~80%`**

Legend: ✅ done · 🟡 partial · ⬜ not started

---

## EPIC 1 — Core gameplay `[██████████] 100%` ✅
Async turn-based 1v1, 6 rounds × 3 questions, category pick, scoring, timeout.
- ✅ Matchmaking, duel (private code), lobby join
- ✅ Round/turn state machine, category select, answer submit
- ✅ Result screen, round summary, leaderboard
- ✅ Active-matches list + polling
- ✅ **QoK tiered match fee** — active games 1-5 → 50 coins, 6-10 → 200, 11-15
  → 300; hard cap 15 active games. Backend `MatchFeeForActiveCount` +
  `chargeMatchSlot` on matchmake/duel/lobby; hub shows the current tier's cost.
- ✅ **12h turn timeout** — if the player on turn doesn't act within 12h, the
  match ends in favor of the opponent who already played (`timeoutWinner`).
  (Was 30min + correct-count winner.)

## EPIC 2 — Anti-cheat / security `[██████████] 100%` ✅
- ✅ Correct answers never sent to client (`MaskForClient`)
- ✅ Server-side timing (`TurnStartedAtMs`), client time ignored
- ✅ Turn ownership + match membership enforced
- ✅ Atomic coin deduction (`DeductCoins`, race-free, no negative)
- ✅ Double-reward lock; unified `determineWinner`
- ✅ Server-side player identity (no name/avatar spoofing)
- ✅ Method-aware rate limit (poll vs submit)
- ✅ Unit tests (game logic, scoring, winner, spin weighting, packages)

## EPIC 3 — Economy & payment `[████████░░] 80%` 🟡
- ✅ Zibal request/verify, bonus credited, amount cross-check, idempotent
- ✅ Packages single source + `GET /v1/payment/packages`
- ✅ Centralized economy constants (entry fee, rewards)
- ✅ Merchant code in env (not source)
- ✅ **Prod payment fixed** — docker-compose now passes `ZIBAL_MERCHANT` /
  `ZIBAL_CALLBACK_URL` / `ZIBAL_ALLOWED_HOSTS` into the container (was the cause
  of "redirects to localhost" + "sandbox gateway"). Backend also honors the
  client `callback_url` when its host is allow-listed. See game-system.md
  "Deploy checklist (payment)".
- ⬜ **Coin inflation tuning** — payout > sink per match; decide final numbers
- ⬜ **Admin-tunable economy** — move constants to DB-backed config editable in manager
- ⬜ **Transaction history view** for users (store purchases)

## EPIC 4 — Daily spin wheel (گردونه شانس) `[████████░░] 80%` 🟡
- ✅ Backend: weighted server-side prize table, atomic once-per-day claim
  (Redis SetNX, reset at Tehran midnight), `GET/POST /v1/game/spin`
- ✅ Frontend: spin button on BOTH the hub and the lobby + animated wheel page
  + countdown to next spin
- ✅ Unit tests (weighting, distribution, weights sum to 100)
- ⬜ **Streak bonus** — consecutive-day multiplier (QoK-style)
- ⬜ **Manager config** — edit prize table/weights from admin panel
- ⬜ **Spin SFX / better win animation**

## EPIC 5 — Manager (admin panel) `[███████░░░] 70%` 🟡
- ✅ Game stats dashboard (active matches, queue, recent matches)
- ✅ Question moderation (approve/reject user submissions + notify)
- ✅ Official question CRUD (create/edit/delete, skips moderation)
- ✅ Leaderboard / top players view (coins, level, W/L/T, total) + search
  (`GET /api/v1/admin/game/leaderboard`, page /dashboard/game-leaderboard)
- ⬜ **Ban/suspend player from game** (cheaters)
- ⬜ **Economy config editor** (entry fee, rewards, packages, spin prizes)
- ⬜ **Question bulk import** (CSV/JSON)
- ⬜ **Category management** (currently hardcoded in Go)
- ⬜ **Match inspector** (open a match, see rounds/answers for disputes)

## EPIC 6 — Realtime & performance `[░░░░░░░░░░] 0%` ⬜
- ⬜ **WebSocket/SSE** push instead of 2–3s polling (cut latency + Redis writes)
- ⬜ Read-only fast path in `GetMatch` (avoid re-`SaveMatch` on every poll)
- ⬜ Backoff/visibility-aware polling on the client

## EPIC 7 — New game modes & features (QoK-inspired ideas) `[██░░░░░░░░] 22%` 🟡
Ideas drawn from Quiz of Kings to deepen engagement:
- ✅ **Lifelines** — 50/50 (حذف دو گزینه) + audience % (جواب مردم) +
  re-spin category (شانس مجدد). All server-authoritative (server picks hidden
  options / vote split / new categories; correct answer never sent), coins
  charged atomically (40/60/80), 50-50 & audience once-per-question locked.
- ✅ **Daily missions** — 4 missions (play 3, win 1, 15 correct, spin), progress
  auto-tracked at match finish + spin, atomic claim with coin reward, Tehran
  daily reset. Backend `game_missions` table + `/v1/game/missions[/claim]`;
  page `/game/missions` + hub button. (Weekly challenges still ⬜.)
- ⬜ **Achievements / badges** (نشان‌ها) on profile
- ⬜ **League / rank tiers** (سطح‌بندی لیگ) with seasonal reset
- ⬜ **Friends & rematch** — invite a recent opponent, friend list
- ⬜ **In-game chat / emotes** during a match (the "گفت‌وگو" tab is a stub)
- ⬜ **Avatar shop** — spend coins on cosmetics (frames, avatars)
- ⬜ **Coin gifting / referral bonus**
- ⬜ **Push notifications** — "نوبت توئه" / "حریف پیدا شد" / spin ready
- ⬜ **Question difficulty + Elo-based matchmaking**
- ⬜ **Report-question button** in-match (quality feedback loop)

---

## Changelog
- **2026-06-20 (session 7):** QoK match parity — tiered match fee (1-5→50,
  6-10→200, 11-15→300, cap 15 active games); 12h turn timeout with
  "player who played wins" (`timeoutWinner`); spin button added to the hub too;
  hub cost UI reflects free/200. Prod payment fix (compose env pass + client
  callback allow-list) + deploy checklist. Re-spin lifeline (شانس مجدد) done →
  lifelines complete. (Uncommitted — pending review.)
- **2026-06-20 (session 6):** Daily missions end-to-end (table, increment hooks
  at match finish + spin, claim endpoint, /game/missions page + hub button).
- **2026-06-20 (session 5):** Manager game leaderboard (top players + stats +
  search) with admin endpoint. Lifelines live — 50/50 + audience (server-side,
  anti-cheat, atomic coin charge, once-per-question lock) + tests; wired into
  QuestionCard.
- **2026-06-20 (session 4):** Spin wheel (backend+frontend+tests), lobby spin
  button, manager official-question CRUD (create/edit/delete) + backend
  endpoints. This roadmap created.
- Session 3: unit tests, method-aware rate limit, CI build fix.
- Session 2: unified winner, atomic coin deduct, Zibal bonus+amount check,
  server-side identity, economy constants.
- Session 1: full UI redesign (violet, anti-QoK), duel/res.data bug fixes.

See `docs/game-system.md` for architecture & anti-cheat detail.
