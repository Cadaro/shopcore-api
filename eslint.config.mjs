// eslint.config.mjs
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // Ignore patterns
  {
    ignores: ['build/**', 'node_modules/**', 'coverage/**', 'tmp/**'],
  },

  // JavaScript recommended
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
]);
