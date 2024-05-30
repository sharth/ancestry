import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import google from "eslint-config-google";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  google,
  {
    rules: {
      "require-jsdoc": "off",
      "max-len": ["error", { "code": 120 }]
    }
  }
);