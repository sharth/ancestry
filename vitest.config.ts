import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/test-setup.ts"],
    browser: {
      expect: {
        toMatchScreenshot: {
          // Centralize screenshot baselines under a single top-level directory
          // (mirroring each spec file's path) instead of scattering
          // `__screenshots__` folders throughout `src`.
          resolveScreenshotPath: ({
            root,
            testFileDirectory,
            testFileName,
            arg,
            browserName,
            platform,
            ext,
          }) =>
            `${root}/.vitest-screenshots/${testFileDirectory}/${testFileName}/${arg}-${browserName}-${platform}${ext}`,
        },
      },
    },
  },
});
