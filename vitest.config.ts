import { defineConfig } from "vitest/config";

export default defineConfig({
  optimizeDeps: {
    include: ["dexie"],
  },
  test: {
    setupFiles: ["./src/test-setup.ts"],
  },
});
