/**
 * Flat config for the `@rancher/components` workspace — successor to its `.eslintrc.js`
 * (which was `root: true` and extended `../../.eslintrc.default.js`). It shares the same
 * base (`eslintConfigBase`) and layers the workspace-specific rules on top.
 *
 * Self-contained on purpose: with ESLint's config-lookup-from-file (default in v10), a file
 * under this workspace resolves to THIS config alone — exactly as `root: true` did before.
 */
import globals from 'globals';
import { eslintConfigBase } from '../../eslint.config.base.mjs';

export default [
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      'src/shim-tsx.d.ts',
      'src/shim-vue.d.ts',
    ],
  },

  ...eslintConfigBase,

  {
    languageOptions: { globals: { ...globals.node } },
    settings:        { 'import/ignore': ['vue'] },
    rules:           {
      'vue/no-mutating-props':                'warn',
      '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      'vue/multi-word-component-names':           'off',
      '@typescript-eslint/ban-ts-comment':        ['error', { 'ts-nocheck': false }],
      '@typescript-eslint/no-unused-vars':        ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        // typescript-eslint v8 changed default caughtErrors to 'all'; keep the
        // pre-upgrade behaviour of not reporting unused caught errors.
        caughtErrors:              'none',
        caughtErrorsIgnorePattern: '^_',
      }],
      'vue/one-component-per-file':       'off',
      'vue/no-deprecated-slot-attribute': 'off',
      'vue/require-explicit-emits':       'off',
      'vue/v-on-event-hyphenation':       'off',
    },
  },
];
