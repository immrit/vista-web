# Vista Quiz (ویستا کوییز) — System & Design Notes

Memory doc for the game section. Covers architecture, anti-cheat model, the
Quiz-of-Kings parity goal, the custom UI design system, and a running list of
known issues / TODOs. Update this when the game changes.

---

## 1. What the game is

Async turn-based 1v1 trivia, modeled on the Iranian app **Quiz of Kings**
(QoK). Two players, 6 rounds, 3 questions per round. Each round one player
picks a category, both answer the same 3 questions, score by correctness +
speed. Players take turns asynchronously (not real-time) — you answer your
round, opponent answers later, you poll for updates.

**Parity goal:** gameplay/economy should feel like QoK, but the UI must NOT
look like a copy-paste of QoK. See §5.

---

## 2. Repos / file map

Frontend: `E:\vista-web` (Next.js App Router, TS, Tailwind)
Backend:  `E:\vista-backend` (Go, Redis match state, Postgres profiles)

### Frontend
- `src/app/game/page.tsx` — hub: profile header, start button, lobby/duel, active matches, leaderboard tab
- `src/app/game/lobby/page.tsx` — open matches waiting for opponent
- `src/app/game/duel/create/page.tsx` — create/join private duel by code
- `src/app/game/match/[matchId]/page.tsx` — match detail: scoreboard, round list, result screen
- `src/app/game/play/[matchId]/page.tsx` — active play: category pick / question / waiting states
- `src/app/game/profile/page.tsx` — own game profile (edit name/avatar, stats)
- `src/app/game/profile/[userId]/page.tsx` — public game profile
- `src/app/game/store/page.tsx` + `store/verify/page.tsx` — coin purchase via Zibal
- `src/app/game/settings/page.tsx` — user-submitted question factory
- `src/components/game/QuestionCard.tsx` — question + options + timer + lifelines
- `src/components/game/CategorySelector.tsx` — category pick grid
- `src/components/game/ActiveMatchCard.tsx` — active-match row on hub
- `src/lib/game/{types,state,player,questions}.ts` — client types + turn helpers (mirror of server)
- `src/lib/apiClient.ts` — **`get/post` return `T` directly, NOT `{data:T}`** (common bug source)

### Backend
- `internal/game/redis_match.go` — match state machine (matchmaking, pick, submit, scoring, winner, timeout)
- `internal/game/coins.go` — `DeductCoinsForGame` atomic coin debit w/ distributed lock
- `internal/game/questions.go` — static question bank + crypto-seeded shuffle
- `internal/httpapi/game_handlers.go` — HTTP routes, reward payout, rate limits, `MaskForClient`
- `internal/httpapi/game_sso.go` — game session SSO (scoped `game_token` cookie)

---

## 3. Backend security / anti-cheat model (AUDITED — strong)

The client is NOT trusted. Verified protections:

1. **Correct answers never leave the server.** `MaskForClient` builds
   `QuestionForClient` which omits `CorrectOptionIndex`. GET match, action
   responses, active-matches, lobby all go through masking. Client literally
   cannot know the answer.
2. **Server-side timing.** `RoundState.TurnStartedAtMs` is set server-side on
   category-pick and reset after each answer. `SubmitAnswer` computes
   `serverTimeTakenMs` from the server clock; the client-sent `timeTakenMs` is
   only a display fallback. Score time-bonus uses server time → can't fake fast
   answers. Clamped to `MaxTimeTakenMs = 14000` (10s client timer + 4s grace).
3. **Turn ownership enforced.** `PickCategory`/`SubmitAnswer` reject unless
   `currentRound.TurnPlayerID == playerID` and `PickerID == playerID` for picks.
   `matchHasPlayer` gates every match access (403 otherwise).
4. **Re-answer blocked.** `isAnswerPending` guards; once answered, repeat
   submits are no-ops.
5. **Input validation.** `answerIndex` bounds-checked vs options; `questionIndex`
   bounds-checked; category validated via `IsValidCategory`.
6. **Atomic coins.** `DeductCoinsForGame` takes a Redis `SetNX` distributed lock
   per user, reads balance from DB (source of truth), debits, Lua-script safe
   unlock. Entry fee 50 coins. Rolled back if match creation fails.
7. **Double-reward prevention.** `awardFinishedMatch` takes a Redis NX
   `reward_lock:<matchId>` + sets `RewardedAt`; payout runs once.
8. **Rate limits.** `game:` bucket 30/min on mutating endpoints; `game_ans:`
   bucket 60/min on `/v1/game/match/` (covers submit + GET poll).
9. **Unpredictable questions.** `safeRand` seeded from `crypto/rand`; question
   order can't be predicted.
10. **Question submission validated.** 4 options required, length caps
    (`MaxQuestionTextLen=500`, `MaxOptionLen=200`), correct index 0..3, category
    valid; user questions start `status=pending` (need approval before live).

**Conclusion:** no client-trust cheat path found. Don't add one — keep all
scoring/timing/answer-checking server-side; never send `CorrectOptionIndex`.

---

## 4. Known issues / TODOs

### Fixed this session
- `apiClient` `res.data` misuse → `get/post` return `T` directly. Fixed in
  `duel/create`, `settings`, `store`, `store/verify`. (Symptom: questions never
  loaded, payment redirect/verify silently failed.)
- Phantom desktop sidebar offset: game pages used `md:right-[220px]` for a
  220px sidebar that does NOT exist (game section sets `shouldHideAppShell`
  true in `src/lib/auth/routes.ts`, so no `DesktopSidebar`). Fixed bottom nav
  (hub) + play button (match) now center via `left-1/2 -translate-x-1/2
  w-full max-w-md`.
- UI recolored from QoK-blue (`#1a6ebd/#114b82/#1b73b5/#20b2f5/#3ca2ea`) to
  violet palette across ALL game pages incl. profile/store/settings (were left
  blue in earlier pass).

### Fixed (session 2 — economy/payment/anti-cheat)
- **Winner criteria unified.** New `determineWinner(match)` in `redis_match.go`
  is the single source of truth: more correct answers wins, tie on correct →
  break by score, else `"tie"`. Used by BOTH normal finish AND timeout expiry.
  (Was: score-based on finish, correct-count on timeout.)
- **Atomic coin deduction.** New `profile.DeductCoins` =
  `UPDATE ... WHERE coins >= amount RETURNING coins` (single statement,
  race-free, can't go negative). `DeductCoinsForGame` now uses it instead of
  read-then-write; Redis lock kept as defense-in-depth.
- **Zibal bonus credited.** Coin packages centralized in
  `internal/payment/packages.go` (single source: coins+bonus+price). Verify now
  credits `coins+bonus` (was base only — frontend promised bonus, backend never
  gave it). New `GET /v1/payment/packages`; frontend store fetches it (fallback
  to static). Verify also cross-checks Zibal `amount == package.AmountRial`.
- **Server-side player identity.** `resolvePlayer(ctx, userID)` derives
  name/avatar from game profile → main profile → fallback, ignoring client-sent
  values. Fixes duels showing "User xxxx" AND prevents name/avatar spoofing.
  Applied to matchmake / duel create / duel join / lobby join.
- **Economy constants centralized** in `redis_match.go` (`EntryFee`,
  `CoinsPerCorrect`, `XPPerCorrect`, `Win/Tie/Loss` bonuses). Used by
  `awardFinishedMatch` + all 4 entry-fee sites. Values unchanged.
- **Zibal merchant code** lives in `.env` `ZIBAL_MERCHANT` (gitignored), NOT in
  source. `.env.example` has a `zibal` (sandbox) placeholder. Callback in
  `ZIBAL_CALLBACK_URL`.

### Fixed (session 3 — engineering hardening)
- **Method-aware rate limit** on `/v1/game/match/`. GET poll and POST action
  no longer share one 60/min bucket: GET → `game_poll:` 180/min, POST →
  `game_ans:` 60/min. Polling can't 429 the answer path anymore.
- **First game unit tests** — `internal/game/game_test.go` (isAnswerPending,
  hasPendingAnswer, countCorrectAnswers/scoring, determineWinner all branches,
  expectedPlayingTurn turn order) + `internal/payment/packages_test.go`
  (price×10==Rial invariant, bonus/total, lookup). Backend CI already runs
  `go test -race ./...`.
- **CI build unbroken** — root scratch scripts `test_bazaar.go` / `find_cols.go`
  (both `package main`) collided → `go build ./...` failed with
  `main redeclared`. Tagged `//go:build ignore` so they're excluded from the
  build but still runnable via `go run`.

### Open — backend
- **Mild coin inflation.** Up to 230 coins earned per match vs 100-coin sink
  (2×`EntryFee`). Net injection per match. Tune `EntryFee`/rewards in
  `redis_match.go` if economy needs tightening. Knobs are now one place.
- **Poll vs rate-limit budget.** `play` polls match every 2s (=30/min),
  `match` every 3s (=20/min), both share the 60/min `game_ans:` bucket with
  submits. Heavy/dual usage can hit 429 and stall polling. Consider: separate
  GET poll into its own higher bucket, lengthen poll interval, or move to
  SSE/WebSocket.
- **Write amplification.** `GetMatch` runs `normalizeMatchState` +
  `expireTimedOutMatch` and may `SaveMatch` on every read; under 2s polling ×
  N clients that's a lot of Redis writes. Consider read-only fast path.

### Open — frontend
- **No realtime.** All screens poll. Fine for async turn-based, but a WS/SSE
  push would cut latency + load.
- **Responsive:** game is mobile-first `max-w-md mx-auto` centered column.
  Works on desktop but leaves large empty side gutters. Acceptable for a
  phone-shaped quiz, but a desktop two-pane layout (match list + active board)
  would use the space better. Landscape mobile: `play` screen
  (question+timer+options+lifelines) is tall — verify no clipping on short
  viewports; may need `overflow-y-auto` + smaller min-heights.

---

## 5. UI design system (anti-QoK)

Goal: same *game feel* (chunky, cartoonish, playful, animated) WITHOUT looking
like QoK. QoK signature = bright blue (`#1a6ebd`) bg + `?` watermark pattern +
blue 3D buttons. We diverge by **palette + background pattern**, keep the
game-juice (3D shadow buttons, bounce/pulse, pill round rows, white question
card, colorful category tiles).

### Palette (violet, not QoK-blue)
- App bg: `#4c1d95` (violet-900)
- Header / nav / dark surfaces: `#3b0764`, darker `#2e1065`, deepest `#1e0a3c`
- Inner column (sub-pages): `#6d28d9`, button hover `#5b21b6`
- Accent / avatar borders / XP fill: `#a855f7`, `#7c3aed`
- Kept from original (intentional, not QoK-specific):
  - Green CTA (start/save/play): `#87d235→#73bc26`, shadow `#5da01f`
  - Coins: yellow `#fbbf24/#facc15`
  - Correct/wrong: emerald `#78c02c` / red `#e61a4b`/`#ea4b34`
  - Duel accent: red-orange `#f36b59→#ea4b34`

### Keep these (game juice — do NOT flatten into a generic web UI)
- Chunky 3D buttons: `shadow-[0_Npx_0_color]` + `active:translate-y` press.
- Bounce on result badge, pulse on "your turn", spin loaders.
- White rounded question card with floating category badge.
- Colorful category tiles with per-slot gradients.
- Pill-shaped round rows with answer dots (green/red/empty).
- Background: subtle `★` star pattern at ~5% opacity (replaces QoK `?`).

### Lesson learned (don't repeat)
A previous pass over-corrected into a dark/minimal/flat "SaaS" look (glass
cards, thin borders, muted) — that KILLED the game feel. User feedback:
keep it کارتونی/پاستیلی/تپل (cartoonish/pastel/chunky). Only the **color** and
**background motif** should differ from QoK, not the playful design language.

---

## 6. Game economy (for reference)
Constants live in `internal/game/redis_match.go` (backend) — change them there.
- Entry fee: 50 coins (matchmake / duel create / duel join / lobby join).
- Reward per correct answer: +10 coins, +20 XP.
- Win bonus: +50 coins, +100 XP. Tie: +20 coins, +50 XP. Loss: +20 XP.
- Level curve (backend `calculateLevel`): `level = floor(sqrt(xp/100)) + 1`,
  i.e. you reach level L at `(L-1)² × 100` XP. Frontend hub mirrors this
  (`xpForPrevLevel`/`xpForLevel`) — keep in sync.
- 6 rounds × 3 questions = 18 questions max → up to 180 correctness coins +
  win bonus per match.

## 7. Payment (Zibal)
- Gateway: Zibal (`gateway.zibal.ir/v1`), works in **Rial** (price shown in
  Toman; `AmountRial = PriceToman × 10`).
- Merchant code: env `ZIBAL_MERCHANT` (gitignored `.env`). Sandbox = `"zibal"`.
- Packages: single source `internal/payment/packages.go`
  (`coins_1000` / `coins_5000`+500 bonus / `coins_12000`+2000 bonus). Exposed
  via `GET /v1/payment/packages`; frontend store fetches it.
- Flow: `POST /v1/payment/zibal/request` → redirect to `gateway.zibal.ir/start/<trackId>`
  → callback `ZIBAL_CALLBACK_URL` (`/game/store/verify`) → `POST /v1/payment/zibal/verify`.
- Verify safety: idempotent (tx `status='paid'` blocks double credit; Zibal 201
  = already verified), amount cross-checked vs package, coins = base + bonus.
- ⚠️ The merchant code `6910eb0…` was pasted in chat — rotate it if that history
  is shared.
