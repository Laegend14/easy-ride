import "server-only";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { serverEnv } from "@/lib/env";

type CircleClient = ReturnType<typeof initiateDeveloperControlledWalletsClient>;

let client: CircleClient | null = null;

/** Memoized developer-controlled-wallets client. Server-only. */
export function getCircleClient(): CircleClient {
  if (!client) {
    client = initiateDeveloperControlledWalletsClient({
      apiKey: serverEnv.circleApiKey,
      entitySecret: serverEnv.circleEntitySecret,
    });
  }
  return client;
}
