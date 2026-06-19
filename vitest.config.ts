import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      // Allow unit-testing modules that import "server-only".
      "server-only": resolve(__dirname, "tests/stubs/server-only.ts"),
      "@": resolve(__dirname, "src"),
    },
  },
});
