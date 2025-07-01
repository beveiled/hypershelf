import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: { deps: { inline: ["convex-test"] } },
    coverage: {
      include: ["convex/**/*"],
      // Exclude files that are either a part of machine-generated code OR cannot be tested using convex-test
      exclude: [
        "convex/auth.ts",
        "convex/crons.ts",
        "convex/*.config.ts",
        "convex/_generated/*",
        "convex/authProviders/*"
      ]
    }
  }
});
