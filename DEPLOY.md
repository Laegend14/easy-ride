# Easy Ride — Deployment Guide (M24)

Target: **Vercel** (Next.js 16, App Router, Turbopack). The git repo root is
`easy-ride/` itself, so Vercel's **Root Directory** = repository root (default).
The `contracts-hardhat/` folder is an isolated package and is **not** part of the
Next build — leave it as-is; it never ships to Vercel.

## Pre-deploy gate (run locally, must pass)

```bash
cd easy-ride
npm run verify        # = check:web2  +  test (43)  +  build
```

`npm run verify` is the single green-light command:
1. **check:web2** — fails the build if any blockchain term reaches user-facing UI.
2. **test** — 43 Vitest unit tests.
3. **build** — production `next build` (also type-checks).

Last verified locally: build ✓ (15 routes), tests ✓ 43/43, web2 ✓, `tsc` ✓.

## 1. Environment variables (set in Vercel → Project → Settings → Environment Variables)

These mirror `.env` (never commit it). All are needed at **runtime**; the build
itself only hard-requires the two `NEXT_PUBLIC_*` (read at import time).

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production+Preview | public, build-time |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production+Preview | public, build-time |
| `GEMINI_API_KEY` | Production+Preview | server secret |
| `CIRCLE_API_KEY` | Production+Preview | server secret |
| `CIRCLE_ENTITY_SECRET` | Production+Preview | server secret |
| `CIRCLE_WALLET_SET_ID` | Production+Preview | from `scripts/setup-circle.mjs` |
| `GEMINI_MODEL` | optional | defaults `gemini-2.5-flash` |
| `ARC_RPC_URL` | optional | defaults Arc Testnet RPC |
| `ARC_DEPLOYER_PRIVATE_KEY` | optional | enables real on-chain escrow; absent ⇒ DB-only fallback |

> If the Circle/Arc secrets are omitted, the app still runs: on-chain steps
> degrade gracefully and the database stays authoritative (see `isEscrowConfigured()`).

## 2. Build settings (Vercel auto-detects; confirm)

- Framework preset: **Next.js**
- Build command: `next build` (default)
- Install command: `npm install` (default)
- Output: `.next` (default)
- Node version: 20.x

## 3. Supabase wiring

- The deployed Supabase project (`aehluthpcbcwojedtfdq`) already holds the schema
  (migrations 0001–0014) and RLS. No migration step runs on Vercel.
- Add the Vercel production domain to **Supabase → Auth → URL Configuration**
  (Site URL + Redirect URLs) so email confirmation / OAuth callbacks resolve to
  the live domain instead of localhost.

## 4. One remaining manual security toggle (the last advisor WARN)

Enable **Supabase → Authentication → Policies → Leaked password protection**
(HaveIBeenPwned check). It's a dashboard switch, not code. After enabling, the
security advisor drops to a single, intentional WARN (`activate_wallet`
SECURITY DEFINER — an accepted no-service-role tradeoff).

## 5. Post-deploy smoke test

1. Visit the live URL → landing renders.
2. Sign up → confirm email → land on onboarding → complete it.
3. Request **"Take me to the airport"** → offers + agent reasoning appear.
4. Book → Protected Payment secured → settle → Digital Receipt.
5. Open **Settings → Advanced** → payment account / network populate (proves the
   Circle/Arc wiring works in production).

If step 3 returns offers but no booking confirmation, check the Circle/Arc env
vars and the operator wallet's testnet funds (faucet.circle.com).
