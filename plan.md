# Easy Ride — Master Build Plan & Handoff

> **Purpose of this file:** a self-contained handoff so anyone (or any AI) can
> understand the whole project and continue building from where we stopped, without
> the original chat. Updated at **every milestone**. Last updated: **M24 + M12.1
> (real rider-funded escrow — see §5)**.

---

## 1. What Easy Ride is (objective)

Easy Ride is a **production-ready, AI-powered autonomous mobility platform**. A user
says where they want to go in plain language ("Take me to the airport") and an AI
agent: parses the request → searches ride providers → compares price/ETA/rating →
picks the best → books it → locks payment in escrow → tracks the ride → settles on
completion → recovers (rebooks) if the driver cancels.

**Hard product rule — Web2-first (CRITICAL):** the UI must NEVER expose blockchain
terminology. No "wallet", "smart contract", "blockchain", "transaction hash",
"token", "gas", "vault", "chain", "RPC", "signer". Use instead: **Easy Ride
Balance, Protected Payment, Secure Ride Lock, Secure Settlement, Payment Record,
Digital Receipt, Verified Payment**. Blockchain/technical details may appear ONLY
under **Settings → Advanced** (collapsed by default). Every milestone is grep-checked
for forbidden terms in user-facing components.

**Build discipline:** follow milestones **M0–M24 sequentially**. A milestone is done
only when all deliverables + acceptance criteria are met and verified. Use official
docs as the source of truth; never hallucinate APIs.

---

## 2. Tech stack

- **Frontend:** Next.js 16.2.7 (App Router, Turbopack), React 19, TypeScript,
  Tailwind **v4** (no config file — tokens live in `src/app/globals.css` via
  `@theme inline`), Framer Motion, lucide-react. Design system "Aurora" (dark,
  glassmorphism, teal `#14B8A6` → indigo `#6366F1` → violet `#A855F7` gradients;
  Space Grotesk display + Inter body).
- **Backend/data:** Supabase (Postgres + Auth + RLS), `@supabase/ssr`.
- **AI:** Google Gemini via `@google/genai` (model `gemini-2.5-flash`).
- **Payments/chain:** Circle **Developer-Controlled Wallets** (`@circle-fin/
  developer-controlled-wallets`) on **Arc Testnet** (USDC-native L1); Solidity
  escrow via **Hardhat** + ethers v6.
- **State:** Zustand, TanStack Query (provider wired).
- Deploy target: Vercel.

---

## 3. Key resources / IDs

- **Supabase project ref:** `aehluthpcbcwojedtfdq` (org "Laegend's Org", eu-west-1).
- **Stitch project:** `projects/12582008679056832494`; **Aurora design system:**
  `assets/2636239349200017832`. (Stitch screen generation has been unreliable —
  build UI from the Aurora token spec; Stitch is just a visual guide.)
- **Deployed escrow contract (Arc Testnet):**
  `0xc966451619B6a30b1aF8Dd8364B2A79a7da2C447` (chainId **5042002**), explorer
  `https://testnet.arcscan.app`. ABI/address exported to
  `src/lib/contracts/easyRideEscrow.ts`.
- **Operator/deployer wallet:** `0x1014f15b3E2fe78F21eea1660eEAD54B1d6616a7`
  (key in `.env` `ARC_DEPLOYER_PRIVATE_KEY`).
- **Test user's Circle wallet:** id `64974f97-6504-5a1b-90a5-7a016d927de7`,
  address `0xa1c1434f49626d48dfc2c3fe93c21c57c55461ca` (holds real testnet USDC).
- **Arc Testnet:** RPC `https://rpc.testnet.arc.network`, native gas token = USDC,
  faucet `https://faucet.circle.com`.
- **.env keys (gitignored):** STITCH_API_KEY, CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET,
  CIRCLE_WALLET_SET_ID, GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, ARC_DEPLOYER_PRIVATE_KEY.
- **MCP servers:** supabase, circle (docs/codegen), stitch, arc-docs. `.mcp.json`
  gitignored (holds the Stitch key).

---

## 4. Milestones — status (M1–M21 DONE, M22–M24 remaining)

| # | Milestone | Status | Acceptance |
|---|---|---|---|
| M0 | Reference analysis / design system | ✅ folded into Aurora | — |
| M1 | Project initialization | ✅ | app compiles |
| M2 | Database (schema + RLS + triggers) | ✅ deployed, advisor-clean | tables + RLS live |
| M3 | Landing page | ✅ | renders, Web2-first |
| M4 | Circle wallet provisioning | ✅ | wallet active per user |
| M5 | Onboarding | ✅ | profile/prefs saved |
| M6 | Core UI & navigation (app shell) | ✅ | nav + 4(+1) screens |
| M7 | Arc Agent (decision core) | ✅ | scoring/selection/reasoning |
| M8 | Gemini (NL → intent, insights) | ✅ | "take me to the airport" parsed |
| M9 | Provider adapter layer | ✅ | mock providers, registry |
| M10 | Ride search experience | ✅ | recommendations shown + persisted |
| M11 | EasyRideEscrow.sol (Hardhat, Arc) | ✅ deployed | contract live on Arc |
| M12 | Arc payment flow (book→escrow→settle) | ✅ | real on-chain escrow lifecycle |
| M13 | Ride lifecycle system | ✅ | live status timeline in UI |
| M14 | Cancellation recovery | ✅ | rebook + escrow reassign (on-chain) |
| M15 | Activity & history | ✅ | filterable history page |
| M16 | Receipts & transaction records | ✅ | every ride has a receipt |
| M17 | Wallet experience | ✅ **on-chain** | balance/add/withdraw real |
| M18 | Analytics system | ✅ | savings/time/success/score |
| M19 | Notifications | ✅ | bell + center, 6 event types |
| M20 | Profile & settings | ✅ | editing operational |
| M21 | Security hardening | ✅ | SECURITY.md checklist |
| M22 | Testing | ✅ | 43 unit tests green; tsc clean |
| M23 | Hackathon demo flow | ✅ | DEMO.md + reset helper |
| M24 | Final polish / deploy prep | ✅ code/docs | build ✓, DEPLOY.md, web2 guard |

**All 24 milestones code-complete.** The only open items are account-level
actions that need the owner's logins: the actual Vercel deploy and the
Supabase leaked-password toggle (see §9 / §10).

---

## 5. What's been built (per milestone, concrete)

**M1 — Init:** Next 16 app `easy-ride/`, Supabase SSR clients
(`src/utils/supabase/{server,client,middleware}.ts`), `src/proxy.ts` (Next 16
middleware replacement — refreshes session via `updateSession`), QueryProvider,
`src/lib/utils.ts` `cn()`, `src/lib/env.ts`.

**M2 — Database:** migrations `supabase/migrations/0001`–`0014`. 15 tables, all RLS
owner-scoped. Signup trigger `handle_new_user` (SECURITY DEFINER) auto-creates
profile + agent ("Easy Ride Assistant") + agent_preferences + wallet (status
`provisioning`). Money = integer **cents** (bigint); durations = whole minutes.
Key tables: profiles, agents, agent_preferences, destinations, wallets,
ride_requests, ride_quotes, ride_bookings, ride_lifecycle_events, agent_decisions,
escrows, transactions, refunds, notifications, analytics. Enums:
optimization_goal, ride_status, escrow_status, transaction_type/status,
wallet_status, destination_kind, notification_type.

**M3 — Landing:** `src/app/page.tsx` + `src/components/landing/*` (hero with animated
AI search bar, how-it-works, features, trust, CTA, footer) over an animated
`AuroraBackground`. Fonts Space Grotesk + Inter in `layout.tsx`. Aurora tokens +
utilities (`.glass`, `.glass-gradient-border`, `.text-gradient`, `.aurora-mesh`,
`.bg-gradient-brand`) in `globals.css`.

**M4 — Wallet provisioning:** `src/lib/circle/{client,wallets}.ts`. `ensureWallet()`
creates a Circle dev-controlled wallet in the shared wallet set on first app entry
and persists via SECURITY DEFINER RPC `activate_wallet` (migration 0009). Called
from the `(app)` layout.

**M5 — Onboarding:** `src/app/onboarding/*` + `OnboardingWizard` (4 steps: name,
saved places, agent prefs, review). `completeOnboarding` writes profile + prefs +
destinations, sets `onboarding_completed`. Gated: non-onboarded users → /onboarding.

**M6 — App shell:** `src/app/(app)/layout.tsx` (auth + onboarding gate +
ensureWallet) + `AppShell` (desktop sidebar / mobile bottom tabs). Screens:
dashboard, activity, balance, settings (+ analytics added M18). Settings → Advanced
disclosure is the ONLY technical surface.

**M7 — Arc Agent:** `src/lib/agent/*` — `scoring.ts` (per-goal weighted scoring +
budget), `reasoning.ts` (deterministic Web2-first explanations), `lifecycle.ts`
(8 stages ↔ RideStatus), `economic-actions.ts` (`EconomicActions` interface +
`MockEconomicActions`), `agent.ts` (`RideAgent.planRide` + `recoverFromCancellation`,
`prefsFromRow`).

**M8 — Gemini:** `src/lib/gemini/*` — `client.ts` (version-tolerant `generateJson`),
`intent.ts` (`parseRideIntent` + deterministic `fallbackIntent`), `insights.ts`
(`generateRideInsight` + fallback). Model `gemini-2.5-flash`.

**M9 — Providers:** `src/lib/providers/*` — `RideProvider` interface,
`MockProviderAdapter` (deterministic seeded offers: Uber/Bolt/Lyft/inDrive/Tesla),
`ProviderRegistry` (`searchAll` fan-out), `createDefaultRegistry()`.

**M10 — Ride search:** `src/app/(app)/ride/{page,actions}.tsx` + `RideExperience`,
`RideOfferCard`. `requestRide`: Gemini intent → resolve home/work → persist
ride_request → `RideAgent.planRide` → persist ride_quotes → `generateRideInsight` →
persist agent_decision. Migration 0010 = owner INSERT on ride_quotes +
agent_decisions.

**M11 — Escrow contract:** `contracts-hardhat/` (ISOLATED — own package.json/node_
modules; NOT part of the Next build). `EasyRideEscrow.sol`: createRideEscrow,
fundRideEscrow (payable), releaseRidePayment, refundRidePayment, cancelRide,
reassignRide, completeRide + reentrancy guard + events. 7 tests pass. Deployed to
Arc Testnet; `deploy.ts` exports ABI to the app.

**M12 — Payment flow:** `src/lib/contracts/escrow-client.ts` (ethers + operator
wallet), `src/lib/agent/onchain-economic-actions.ts` (real operator contract
calls), `src/lib/payments/booking.ts` (`bookSelectedRide` = create escrow + RIDER
funds it; `settleRide` = complete+release). Migration 0011 = owner write policies
for bookings/escrows/transactions/lifecycle. `BookingPanel` + `PaymentTimeline`
UI. Proven: real Arc txs create/fund/settle.

**M12.1 — REAL rider-funded escrow (no simulation).** Replaced the demo
shortcuts so every escrow is genuinely on-chain and verifiable:
- **True-dollar value:** `centsToWei = cents * 1e16` (100¢ = 1 USDC = 1e18 wei,
  Arc native 18-dp). `centsToUsdcString` gives the matching decimal for Circle.
  Unit-tested invariant: `centsToWei(c) === parseEther(centsToUsdcString(c))` so
  `fundRideEscrow`'s strict `msg.value == amount` always holds.
- **Two-address model (no secondary wallet):** rider = the USER's Circle wallet
  (debited for real), driver/payee = the deployer/operator. `createRideEscrow`
  now sets rider = user address, provider = operator.
- **Rider funds via Circle:** `src/lib/payments/escrow-funding.ts`
  (`fundEscrowFromUser`) calls Circle `createContractExecutionTransaction` →
  `fundRideEscrow(bytes32)` with native `amount`, polls to CONFIRMED/COMPLETE.
  The user's own Easy Ride Balance pays the fare + gas.
- **Hard-fail, not best-effort:** booking pre-generates the booking id, opens +
  funds the escrow on-chain BEFORE any DB write, and returns an error (persisting
  nothing) if either step fails — no DB-only "secured" state. Settlement reverts
  the booking if release fails. Recovery does the on-chain refund/reassign first,
  then DB. Booking does a balance preflight (fare + 0.1 USDC gas headroom).
- **Verified live on Arc Testnet** via throwaway `scripts/verify-escrow-funding.ts`
  (deleted after): create → user-funds (real debit) → complete → release→driver,
  4 real tx hashes; Circle `amount:"0.10"` attached exactly `1e17` wei (confirmed
  18-dp). NOTE: the operator/deployer is also the driver, so completed-ride funds
  return to it (it only ever spends gas); the user's wallet is the real payer.

**M13 — Lifecycle:** `src/lib/payments/ride-status.ts`, `StatusTimeline`,
`LiveStatus` (polls every 4s), `/ride/[id]` detail page. Dashboard shows active-ride
card; Activity rows link to detail.

**M14 — Cancellation recovery:** `src/lib/payments/recovery.ts` (`recoverRide`:
cancel → preserve escrow → agent finds alternative → on-chain `reassignRide` →
new booking `is_reassignment`; or refund if none). `settleRide` uses
`escrow.onchain_escrow_id` as the on-chain key. "Simulate driver cancellation" in
LiveStatus. Proven on-chain: reassign keeps funds, settles to new provider.

**M15 — Activity & history:** `listRidesWithCategory()` (completed/cancelled/
refunded/reassigned/active) + `ActivityHistory` filter tabs.

**M16 — Receipts:** `src/lib/payments/receipt.ts` (Ride/Settlement/Refund type) +
`RideReceipt` + `/ride/[id]/receipt` + print CSS (`@media print` light receipt).

**M17 — Wallet (ON-CHAIN, not mocked):** `src/lib/circle/balance.ts`
(`getOnchainBalance` reads real USDC via `getWalletTokenBalance`), `funding.ts`
(`addFunds` = real `requestTestnetTokens` faucet; `withdrawFunds` = real
`createTransaction` USDC transfer with the ERC-20 USDC tokenId). Balance page +
dashboard read live chain balance. `savings.ts`, `wallet-activity.ts`,
`FundControls`, `ActivityList`. Migration 0012 = wallet owner UPDATE. Proven:
read $39.90 live after a real 0.1 USDC withdraw.

**M18 — Analytics:** `src/lib/analytics/metrics.ts` (savings, time saved, success
rate, optimization score — all derived live from ride data) + `/analytics` page +
`StatCard`. Added "Insights" nav tab (bottom bar now 5 cols).

**M19 — Notifications:** migration 0013 = notifications owner INSERT.
`src/lib/notifications/{notify,queries,actions}.ts`; emits from booking/settle/
recovery. `NotificationBell` (polls 12s, unread badge, mark-all-read) in app shell.

**M20 — Profile & settings:** migration 0014 = profiles `notify_ride_updates`,
`notify_savings_reports` (notify() respects them). `settings/actions.ts`
(updateProfile/Preferences/Notifications/Password) + four form components. Email
read-only; Security = password change.

**M21 — Security hardening:** `src/lib/security/{rate-limit,validate}.ts` applied to
sensitive actions; `env.ts` `missingEnv()`/`validateEnvOrThrow()`; `SECURITY.md`
checklist. Advisor: only 2 intentional WARNs (`activate_wallet` definer tradeoff;
leaked-password protection = dashboard toggle, still OFF).

**M22 — Testing:** Vitest 4 (node env), config `vitest.config.ts` aliases
`server-only` → `tests/stubs/server-only.ts` and `@` → `src`; `tests/setup.ts`
(setupFiles) injects placeholder env so modules that read env at import time
(`env.ts` `publicEnv`) load in tests. Scripts: `npm run test` / `test:watch` /
`test:cov`. **43 tests across 8 files, all green; `tsc --noEmit` clean.** Coverage:
agent `scoring`/`reasoning`/`lifecycle`, security `rate-limit`/`validate` (pre-
existing), plus new `providers/mock-provider` (determinism, EV/shared/class
filters, registry fan-out + failing-adapter skip), `gemini/intent` (deterministic
`fallbackIntent`), `agent/agent` (`prefsFromRow`, `planRide` selection/determinism/
over-budget, `recoverFromCancellation` excludes cancelled provider + reassigns
escrow). **Bug found & fixed:** `scoring.ts` normalized rating absolutely
(`rating/5`) while price/speed were min–max normalized, so the `highest_rated`
goal could pick a faster/cheaper offer over the top-rated one. Added
`higherIsBetter()` and switched rating to candidate-set min–max — all goals now
select correctly. Hardhat's 7 contract tests remain in `contracts-hardhat` (run
separately, not wired into Vitest by design — isolated package).

**M23 — Hackathon demo flow:** `DEMO.md` (repo root of `easy-ride/`) — a ~4-min
scripted run-of-show: pre-demo checklist, 9 timed beats (landing → NL request
"Take me to the airport" → ranked offers + agent reasoning → book/Protected
Payment → live tracking → settle/Digital Receipt → **cancellation recovery**
showcase → Insights → the Settings→Advanced "it was on-chain all along" reveal),
plus fallback/resilience notes and a Web2-first talking-point cheat sheet.
`scripts/reset-demo.sql` — re-runnable, idempotent DO-block that wipes ONE demo
user's transactional rows (ride_requests cascade + escrows/transactions/refunds/
notifications/analytics by user_id) while keeping account/agent/prefs/
destinations/wallet. Run via Supabase SQL Editor or the Supabase MCP
`execute_sql`. (No from-scratch user *seed* script — creating auth users needs
service-role admin, intentionally absent; demo path is manual signup/onboard +
faucet fund + this reset.)

**M24 — Final polish / deploy prep:** Production build verified clean (`next
build`: 15 routes, TS pass, static gen OK). `scripts/check-web2-first.mjs` — a
guard that scans `src/app` + `src/components` `.tsx` for forbidden blockchain
terms in *renderable* text only (JSX text nodes + prose string literals; ignores
code identifiers/imports/comments/CSS classes so `const wallet`/`getWalletSummary`
don't trip it). New npm scripts: `check:web2`, and `verify` =
`check:web2 && test && build` — the single pre-deploy green-light (currently
passes: web2 ✓, 43 tests ✓, build ✓). `DEPLOY.md` — Vercel guide (root dir, env
var table, build settings, Supabase Auth URL wiring, leaked-password toggle,
post-deploy smoke test). Security advisor re-checked: still only the 2 known
intentional WARNs. No source changes needed for deploy.

---

## 6. Architecture / file map (key paths)

```
easy-ride/
  src/app/
    layout.tsx, globals.css, page.tsx        # root + landing
    (auth)/{login,signup}/ + actions.ts      # auth
    onboarding/ + actions.ts
    (app)/layout.tsx                          # gate + shell mount
      dashboard/ activity/ balance/ analytics/ settings/
      ride/{page,actions}.tsx  ride/[id]/{page, receipt/page}
    auth/{callback,confirm}/route.ts
  src/components/{landing,app,ride,wallet,activity,analytics,notifications,settings,onboarding,ui}/
  src/lib/
    agent/  gemini/  providers/  circle/  contracts/  payments/  analytics/
    notifications/  security/  env.ts  utils.ts
  src/utils/supabase/{server,client,middleware}.ts
  src/types/database.ts
  supabase/migrations/0001..0014_*.sql
  contracts-hardhat/   # ISOLATED Hardhat project (own deps); not in Next build
  SECURITY.md  plan.md
```

**Conventions / gotchas (read before editing):**
- Every secret-touching lib imports `import "server-only"`. Client components may
  only `import type` from those, or call `"use server"` actions.
- All DB writes go through **owner-scoped RLS** under the user's session. New
  child-table writes need an INSERT policy (pattern: `with check (exists … parent
  where user_id = auth.uid())`).
- On-chain steps are **best-effort**; the DB is the source of truth so the demo
  never hard-breaks. Real Circle/Arc calls are gated by `isEscrowConfigured()` /
  key presence.
- Tailwind v4: no JS config; edit tokens/utilities in `globals.css`.
- **Dev server**: run `npm run dev` (port 3000). It sometimes lingers; before a
  production `npm run build`, kill stray node (`taskkill /F /IM node.exe`) to free
  `.next`. Restart dev after building.
- **Verification pattern**: throwaway `scripts/verify-*.ts` run via `npx tsx`
  (load `.env` manually; stub `server-only` in require.cache), then delete.
- The auto-mode permission classifier intermittently blocks writes/commands —
  retry or proceed via approved prompts.

---

## 7. Database (RLS write paths added incrementally)

- 0007: base owner SELECT/(some ALL) policies. 0009: `activate_wallet` RPC.
- 0010: ride_quotes + agent_decisions owner INSERT.
- 0011: ride_bookings/escrows/transactions/ride_lifecycle_events owner INSERT/UPDATE.
- 0012: wallets owner UPDATE. 0013: notifications owner INSERT.
- 0014: profiles notification-preference columns.

---

## 8. How to run & verify

```
cd easy-ride
npm install
npm run dev            # http://localhost:3000
npm run build          # production build (type-checks + server-action rules)
npx tsc --noEmit       # types only

# contracts (separate project)
cd contracts-hardhat && npm install && npm test
npm run deploy:arc     # needs ARC_DEPLOYER_PRIVATE_KEY funded (faucet.circle.com)
```
Per-milestone checks: `tsc` → 0 errors; `npm run build` passes; Supabase
`get_advisors` (security) shows only the 2 known WARNs; Web2-first grep on new
user-facing components finds no forbidden terms.

---

## 9. What remains

**M22 — Testing:** ✅ DONE (see §5). Vitest installed + 43 passing unit tests.

**M23 — Hackathon demo flow:** ✅ DONE (see §5) — `DEMO.md` + `scripts/reset-demo.sql`.

**M24 — Final polish / deploy prep:** ✅ DONE (code/docs; see §5). Remaining are
owner-only account actions: (1) run the Vercel deploy with the env vars from
`DEPLOY.md`; (2) flip the Supabase leaked-password toggle; (3) add the live
domain to Supabase Auth URL config.

---

## 10. Open follow-ups
- **Deploy to Vercel** following `DEPLOY.md` (set env vars, run build). Owner-only
  (needs the Vercel/GitHub login). Run `npm run verify` first — it must be green.
- After deploy, add the live domain to **Supabase → Auth → URL Configuration**.
- Enable **Supabase Auth → leaked password protection** (dashboard toggle; the one
  outstanding advisor WARN that isn't code).
- `activate_wallet` SECURITY DEFINER WARN is an accepted no-service-role tradeoff
  (scoped to `auth.uid()`).
- Rate limiting is in-memory (per-instance) — swap to a shared store for multi-node
  production.
