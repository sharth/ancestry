import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/test-setup.ts"],
    // Each vitest browser "worker" is a separate browser tab/context that's
    // reused across every spec file it's assigned, for the whole run. Specs
    // that touch real, per-origin browser storage (OPFS via
    // navigator.storage.getDirectory(), and previously real IndexedDB before
    // `isolate: true`) aren't scoped per worker the way `isolate` scopes
    // per-file module state, so two workers running concurrently can still
    // collide on that storage and crash the shared browser connection.
    // Serializing file execution avoids that entirely.
    fileParallelism: false,
  },
});
