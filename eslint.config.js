import eslint from "@eslint/js";
import markdown from "@eslint/markdown";
import vitest from "@vitest/eslint-plugin";
import angular from "angular-eslint";
import importX from "eslint-plugin-import-x";
import testingLibrary from "eslint-plugin-testing-library";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      "new-cap": "off",
      "require-jsdoc": "off",
      "import-x/no-cycle": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        { allowConstantLoopConditions: "only-allowed-literals" },
      ],
      "@typescript-eslint/no-unnecessary-type-arguments": "off",
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: true },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "app", style: "camelCase" },
      ],
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "app", style: "kebab-case" },
      ],
      "@angular-eslint/prefer-on-push-component-change-detection": "error",
    },
  },
  {
    files: ["**/*.spec.ts"],
    extends: [
      vitest.configs.recommended,
      testingLibrary.configs["flat/angular"],
    ],
    rules: {
      // Conflicts with this codebase's established pattern of calling render()
      // in beforeEach and storing the result for use across it()s.
      "testing-library/no-render-in-lifecycle": "off",
      "testing-library/render-result-naming-convention": "off",
      // Conflicts with this codebase's established pattern of querying the
      // rendered DOM directly (see #402).
      "testing-library/no-node-access": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    files: ["**/*.md"],
    extends: [...markdown.configs.recommended],
  },
]);
