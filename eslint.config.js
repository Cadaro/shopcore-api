import { configApp } from '@adonisjs/eslint-config';

export default configApp({
  rules: {
    '@adonisjs/prefer-lazy-controller-import': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@unicorn/filename-case': 'off',
    '@unicorn/no-await-expression-member': 'off',
    '@unicorn/no-for-loop': 'off',
    '@unicorn/prefer-node-protocol': 'off',
  },
});
