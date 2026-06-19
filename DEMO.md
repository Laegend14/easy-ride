# Easy Ride — Demo Run-of-Show (M23)

A scripted, ~4-minute end-to-end demo of the autonomous mobility agent. Every
beat below maps to a real screen and a real action. Numbers are live (mock
providers are deterministic per route, on-chain escrow is real on Arc Testnet).

> **The one rule on stage:** never say *wallet, blockchain, crypto, smart
> contract, gas, token, transaction hash, on-chain*. Say **Easy Ride Balance,
> Protected Payment, Secure Ride Lock, Digital Receipt, Verified Payment**. The
> only place chain details appear is **Settings → Advanced** (collapsed) — open
> it for technical judges *on request*, as the reveal.

---

## 0. Pre-demo checklist (do this 10 min before)

1. **Env present** — `.env` has all required keys. Sanity check:
   ```bash
   cd easy-ride && node -e "require('dotenv')" 2>/dev/null; \
   grep -E '^(GEMINI_API_KEY|CIRCLE_API_KEY|CIRCLE_ENTITY_SECRET|CIRCLE_WALLET_SET_ID|NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)=' .env | cut -d= -f1
   ```
   (Expect all 6 names listed.)
2. **Tests green** (proves the build is healthy): `npm run test` → 43 passing.
3. **Dev server** running: `npm run dev` → http://localhost:3000.
4. **Demo account ready** — signed up + onboarded once (home + work saved). If
   re-running, reset history (below) so analytics start clean.
5. **Funds** — open **Balance**, click **Add funds** to pull testnet USDC from
   the faucet so the balance shows real money. Confirm a non-zero balance.
6. **Reset (optional, for a clean re-run)** — edit the email in
   `scripts/reset-demo.sql`, then run it in Supabase SQL Editor (or via the
   Supabase MCP `execute_sql`). Keeps account/wallet/onboarding; clears rides.

---

## 1. The hook (15s) — landing page
- Open `/`. Let the Aurora hero + animated AI search bar breathe.
- **Say:** "Easy Ride is an AI agent that books your ride for you. You tell it
  where to go in plain English — it shops every provider, picks the best, pays
  securely, and handles problems on its own."

## 2. Understand (30s) — natural language → intent
- Go to **Request a ride**. Type exactly:
  > **Take me to the airport**
- **Say:** "No forms, no provider picking. The agent parses this with Gemini —
  destination, urgency, vehicle preference — and kicks off a search."
- *(If you want to show off optimization:* try **"get me home, cheapest option"**
  or **"to the office fast"** — the agent's goal changes accordingly.)*

## 3. Compare & decide (45s) — the agent's reasoning
- The results show ranked offers (Uber / Bolt / Lyft / inDrive / Tesla) with the
  **selected** one highlighted, plus the agent's plain-English **reasoning** and
  a **savings** line.
- **Say:** "It scored every option against your goal and budget. Here's *why* it
  chose this one — transparent, not a black box. Over-budget options stay visible
  but aren't picked."

## 4. Book + protect the payment (40s) — escrow lifecycle
- Click **Book**. Watch the **Payment Timeline**: provider confirmed → **payment
  secured** → driver assigned.
- **Say:** "The fare is locked in a **Protected Payment** — held safely, released
  to the driver only when the ride completes. The rider is never overcharged and
  the driver is guaranteed payment."

## 5. Track (30s) — live status
- On the ride detail page, the **Live Status** timeline advances (polls every 4s):
  driver approaching → in progress → destination reached.
- **Say:** "Real-time tracking, all in consumer language."

## 6. Settle + receipt (30s)
- Complete the trip → **Secure Settlement** fires. Open the **Digital Receipt**.
- **Say:** "On arrival the payment settles automatically and the rider gets a
  clean receipt. Done — fully autonomous."

## 7. The differentiator (40s) — cancellation recovery
- Start a second ride, book it, then hit **Simulate driver cancellation**.
- **Say:** "Here's the magic. A driver cancels — the agent *re-plans on its own*,
  excludes that provider, finds the next-best ride, and **moves the protected
  payment to the new booking** without bothering the rider. No re-entering
  anything, no lost money."

## 8. Proof it's intelligent (20s) — Insights
- Open **Insights** (analytics): savings, time saved, success rate, optimization
  score — all derived live from real rides.
- **Say:** "Every decision compounds into measurable savings."

## 9. The reveal — *for technical judges only, on request* (20s)
- **Settings → Advanced** (collapsed by default). Expand it.
- **Say:** "Everything you saw as 'Protected Payment' is actually a real
  on-chain escrow contract on a USDC-native L1, settled in real value. The
  consumer never has to know — that's the point."

---

## Fallback & resilience notes (if something flakes live)
- **Gemini down / slow:** intent parsing falls back to a deterministic parser
  (`fallbackIntent`) — "Take me to the airport" still works. Insights have a
  fallback too. The demo does not hard-break.
- **Circle / Arc unavailable:** on-chain steps are best-effort; the database is
  authoritative, so booking/settle/recovery still complete and the UI still
  tells a coherent story (just without a fresh chain receipt).
- **Offers identical run-to-run:** intended — mock providers are seeded by route
  so the demo is reproducible. Change the destination to change the numbers.
- **Stuck state:** run `scripts/reset-demo.sql` and start from step 1.

## Talking-point cheat sheet
- "Autonomous" = it *decides and acts*, not just suggests.
- "Transparent" = every choice has a recorded, human-readable reason.
- "Protected Payment" = funds safe in escrow until the ride completes.
- "Self-healing" = cancellation recovery re-plans and preserves the payment.
- "Web2-first" = blockchain power, zero blockchain UX.
