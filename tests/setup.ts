// Vitest global setup. Runs before each test file is imported, so placeholder
// env vars are present when modules that read env at import time load
// (e.g. src/lib/env.ts evaluates publicEnv eagerly). These are dummy values —
// unit tests never make real network/API calls.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "test-publishable-key";
process.env.GEMINI_API_KEY ??= "test-gemini-key";
process.env.CIRCLE_API_KEY ??= "test-circle-key";
process.env.CIRCLE_ENTITY_SECRET ??= "test-entity-secret";
process.env.CIRCLE_WALLET_SET_ID ??= "test-wallet-set";
