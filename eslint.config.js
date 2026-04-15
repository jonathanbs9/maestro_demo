import js from '@eslint/js';
import pluginN from 'eslint-plugin-n';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  pluginN.configs['flat/recommended-module'],
  prettierConfig,
  {
    files: ['.scripts/**/*.js'],
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-console': 'off',
      'n/no-process-exit': 'off',
      'n/no-missing-import': 'off',
      // devDependencies are valid imports in this project (no production bundle)
      'n/no-unpublished-import': 'off',
    },
  },
  {
    // Maestro page objects: 'output' is a runtime global injected by Maestro
    files: ['.maestro/src/**/*.js'],
    languageOptions: {
      globals: {
        output: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
    },
  },
];
