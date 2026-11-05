/**
 * Flat ESLint config for a Rancher UI extension.
 *
 * The shared ruleset + eslint toolchain (eslint, neostandard, typescript-eslint, eslint-plugin-vue,
 * ...) are provided by `@rancher/shell`, so this file just re-exports the shared config and adds any
 * project-specific overrides.
 *
 * Linting runs through `@rancher/shell`'s launcher (see the `lint` script in package.json), which
 * selects ESLint 10 for this flat config. Extensions that still use a legacy `.eslintrc.*` file are
 * instead linted with the shipped ESLint 7 toolchain — see the extension ESLint documentation.
 */
import globals from 'globals';
import pluginJest from 'eslint-plugin-jest';
import shellConfig from '@rancher/shell/eslint.config.base.mjs';

export default [
  ...shellConfig,

  // Unit tests. `globals` and `eslint-plugin-jest` come from `@rancher/shell`, the same way as the
  // rest of the eslint toolchain. Without this, `describe`/`it`/`expect`/`jest` are reported as
  // undefined in every test file.
  {
    files: [
      '**/__tests__/**/*.{js,ts}',
      '**/*.{spec,test}.{js,ts}',
      'jest.config.js',
      'jest.setup.js',
    ],
    plugins:         { jest: pluginJest },
    languageOptions: { globals: { ...globals.jest } },
    rules:           {
      ...pluginJest.configs['flat/recommended'].rules,
      'jest/no-commented-out-tests': 'off',
      'jest/no-disabled-tests':      'off',
    },
  },

  // Add project-specific overrides below, e.g.:
  // {
  //   files: ['**/*.vue'],
  //   rules: { 'vue/no-v-html': 'off' },
  // },
];
