import globals from "globals";
import google from 'eslint-config-google';
import javascript from "@eslint/js";
import typescript from "typescript-eslint";


export default [
  { languageOptions: { globals: globals.browser } },
  javascript.configs.recommended,
  ...typescript.configs.recommended,
];
