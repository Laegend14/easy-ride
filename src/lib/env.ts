function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Public (browser-safe) env. Safe to import anywhere.
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "easyride-52548",
};

// Server-only secrets. NEVER import this from a client component.
export const serverEnv = {
  get geminiApiKey() {
    return required("GEMINI_API_KEY", process.env.GEMINI_API_KEY);
  },
  get circleApiKey() {
    return required("CIRCLE_API_KEY", process.env.CIRCLE_API_KEY);
  },
  get circleEntitySecret() {
    return required("CIRCLE_ENTITY_SECRET", process.env.CIRCLE_ENTITY_SECRET);
  },
  get circleWalletSetId() {
    return required("CIRCLE_WALLET_SET_ID", process.env.CIRCLE_WALLET_SET_ID);
  },
  // Optional — has a safe default in the Gemini client.
  get geminiModel() {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
  },
  // Arc Testnet — optional; absence makes on-chain escrow degrade to DB-only.
  get arcRpcUrl() {
    return process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network";
  },
  get arcDeployerKey() {
    return process.env.ARC_DEPLOYER_PRIVATE_KEY || "";
  },
  /** Scales the real fare locked in escrow (1 = full fare). Tunable for demos. */
  get escrowFareScale() {
    const v = parseFloat(process.env.ESCROW_FARE_SCALE || "1");
    return Number.isFinite(v) && v > 0 ? v : 1;
  },
};

/** Names of the secrets the full app expects (server-side). */
const REQUIRED_SERVER = [
  "GEMINI_API_KEY",
  "CIRCLE_API_KEY",
  "CIRCLE_ENTITY_SECRET",
  "CIRCLE_WALLET_SET_ID",
] as const;

const REQUIRED_PUBLIC = [] as const;

/** Returns the list of missing required env vars (empty = all present). */
export function missingEnv(): string[] {
  return [...REQUIRED_PUBLIC, ...REQUIRED_SERVER].filter((k) => !process.env[k]);
}
