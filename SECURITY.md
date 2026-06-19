# Easy Ride — Security Audit Checklist (M21)

Status legend: ✅ implemented · ⚠️ documented tradeoff · 🔲 dashboard action for owner

## 1. Row Level Security (RLS) ✅
Every table in `public` has RLS enabled with **owner-scoped** policies
(`auth.uid()` ownership, directly or via a parent row). Verified across migrations
`0007`–`0014`.

| Table | Read | Write |
|---|---|---|
| profiles | own | own UPDATE |
| agents / agent_preferences | own (via agent) | own UPDATE |
| destinations | own | own ALL |
| wallets | own | own UPDATE (M17) + `activate_wallet` RPC |
| ride_requests | own | own ALL |
| ride_quotes / agent_decisions | own (via request) | own INSERT (M10) |
| ride_bookings | own | own INSERT/UPDATE (M12) |
| escrows / transactions | own | own INSERT/UPDATE (M12) |
| ride_lifecycle_events | own (via booking) | own INSERT (M12) |
| notifications | own | own INSERT (M19) + UPDATE |

**Advisor (re-run M21, confirmed):** only two findings, both intentional:
- ⚠️ `activate_wallet` is `SECURITY DEFINER` callable by `authenticated`. Intentional
  — it writes only the caller's own wallet row (scoped to `auth.uid()`), the
  documented no-service-role tradeoff. Function pins `search_path` and is the sole
  privileged write path for Circle wallet IDs.
- 🔲 "Leaked password protection disabled" — enable in **Supabase → Auth →
  Providers → Password** (dashboard toggle; not code).
Re-run `get_advisors` after deploy to confirm no new findings.

## 2. Input Validation ✅
- Shared helpers in `src/lib/security/validate.ts`: `clampText` (strips control
  chars + length cap), `sanitizeSingleLine`, `isPositiveAmount`, `isEvmAddress`,
  `dollarsToCents`.
- Applied: ride request text capped at 280 chars (`requestRide`); withdrawal
  amount > 0 and balance-bounded + EVM address format (`withdrawFunds`); budgets
  > 0 (`updatePreferences`); password ≥ 8 + match (`updatePassword`); Gemini
  intent output is enum-normalized + clamped (`gemini/intent.ts`).
- All mutations are Next.js **server actions** (CSRF-protected by the framework)
  and re-check `auth.getUser()` server-side; the client cannot bypass validation.

## 3. Rate Limiting ✅ (⚠️ per-instance)
- `src/lib/security/rate-limit.ts` — in-memory sliding window keyed `userId:action`.
- Limits: ride search 10/min, booking/complete/recover 20/min, add funds 5/min,
  withdraw 10/min, password 5/15min.
- ⚠️ Per-instance store (single-node demo). Production: swap the `Map` for a shared
  store (Upstash Redis / Vercel KV) with the same keys.

## 4. Secret Management ✅
- Secrets only in `.env` (gitignored: `.env*`) and `contracts-hardhat/.env`;
  `.mcp.json` gitignored. No secret committed.
- Accessed via `serverEnv` getters (`src/lib/env.ts`). Every secret-touching module
  imports `"server-only"` (circle/*, gemini/*, contracts/escrow-client,
  agent/onchain-*, payments/*, notifications/{notify,queries}, security/rate-limit).
- **Client/server boundary verified:** the only client-component references to
  `@/lib/*` server modules are **type-only imports** (erased at build) or the
  `notifications/actions` **server-actions** bridge. `npm run build` passes — the
  `server-only` guard would throw if any secret module were bundled client-side.
- Public env is limited to `NEXT_PUBLIC_SUPABASE_URL` + publishable key (safe by
  design; RLS enforces access).

## 5. Environment Validation ✅
- `src/lib/env.ts`: lazy `required()` getters + `missingEnv()` /
  `validateEnvOrThrow()` covering the required public + server vars
  (Supabase URL/key, Gemini, Circle API/entity-secret/wallet-set).

## Acceptance
Security audit checklist completed — all five areas implemented/verified above,
with two documented, intentional exceptions (the `activate_wallet` definer
tradeoff and the dashboard-only leaked-password toggle).
