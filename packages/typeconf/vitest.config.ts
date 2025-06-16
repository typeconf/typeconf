import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000, // Increased timeout for file operations
    isolate: false, // Improve performance for tests without side effects
    include: ["test/**/*.test.ts"],
  },
});
