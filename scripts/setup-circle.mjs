// One-time setup: create the shared Circle wallet set for Easy Ride and persist
// its ID to .env as CIRCLE_WALLET_SET_ID. All user wallets are created inside it.
//
// Run once:  node --env-file=.env scripts/setup-circle.mjs
// Idempotent: if CIRCLE_WALLET_SET_ID is already set in .env, it no-ops.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");

const { CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, CIRCLE_WALLET_SET_ID } = process.env;

if (!CIRCLE_API_KEY || !CIRCLE_ENTITY_SECRET) {
  console.error(
    "Missing CIRCLE_API_KEY or CIRCLE_ENTITY_SECRET. Run with: node --env-file=.env scripts/setup-circle.mjs",
  );
  process.exit(1);
}

if (CIRCLE_WALLET_SET_ID) {
  console.log(`CIRCLE_WALLET_SET_ID already set (${CIRCLE_WALLET_SET_ID}). Nothing to do.`);
  process.exit(0);
}

const client = initiateDeveloperControlledWalletsClient({
  apiKey: CIRCLE_API_KEY,
  entitySecret: CIRCLE_ENTITY_SECRET,
});

console.log("Creating Circle wallet set 'Easy Ride Wallets'…");
const res = await client.createWalletSet({ name: "Easy Ride Wallets" });
const walletSetId = res.data?.walletSet?.id;

if (!walletSetId) {
  console.error("No wallet set ID returned:", JSON.stringify(res.data, null, 2));
  process.exit(1);
}

console.log(`✓ Wallet set created: ${walletSetId}`);

// Persist to .env (append or replace the line).
const line = `CIRCLE_WALLET_SET_ID=${walletSetId}`;
let contents = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
if (/^CIRCLE_WALLET_SET_ID=.*$/m.test(contents)) {
  contents = contents.replace(/^CIRCLE_WALLET_SET_ID=.*$/m, line);
} else {
  contents = contents.replace(/\s*$/, "\n") + line + "\n";
}
writeFileSync(envPath, contents);
console.log(`✓ Wrote CIRCLE_WALLET_SET_ID to ${envPath}`);
console.log("Restart the dev server to pick up the new environment variable.");
