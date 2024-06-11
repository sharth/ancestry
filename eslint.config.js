import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import google from 'eslint-config-google';
import markdown from 'eslint-plugin-markdown';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    ...markdown.configs.recommended,
    google,
    {
      rules: {
        'require-jsdoc': 'off',
        'max-len': ['error', {'code': 120}],
        '@typescript-eslint/consistent-type-imports': 'error',
        '@typescript-eslint/no-import-type-side-effects': 'error',
      },
    },
);
