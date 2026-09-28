import { defineConfig } from "vitest/config";

export default defineConfig({
  // `ng test --include <file>` builds a bundle containing only the included
  // spec files, and the Angular CLI's Vitest integration derives its
  // dependency-optimization list from that narrower bundle (it disables
  // Vite's automatic discovery). `src/test-setup.ts`'s global cleanup hooks
  // import `dexie` (a CommonJS package) regardless of which spec files are
  // included, so an --include subset that doesn't itself import anything
  // Dexie-related fails to pre-bundle it for ESM/CJS interop, throwing
  // "does not provide an export named 'default'". Listing it explicitly
  // here fixes `--include` for any subset.
  optimizeDeps: {
    include: ["dexie"],
  },
  test: {
    setupFiles: ["./src/test-setup.ts"],
  },
});
