import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import markdown from "eslint-plugin-markdown";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...markdown.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "new-cap": "off",
      "require-jsdoc": "off",
      "max-len": ["error", { code: 120 }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "@typescript-eslint/no-extraneous-class": "off",
    },
  }
);
