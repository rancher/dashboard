/**
 * Root flat config — the flat-config successor to `.eslintrc.js` (+ `.eslintrc.default.js`
 * via the shared `eslintConfigBase`). Ignores are ported from the old `.eslintignore`.
 *
 * Behaviour-preserving migration: the effective ruleset matches the previous
 * eslintrc setup. A handful of `'off'` rule references were dropped because their plugins
 * are no longer registered (`nuxt/*`, `unicorn/*`) or the rule was removed in
 * typescript-eslint v8 (`@typescript-eslint/no-var-requires`); being `'off'`, dropping them
 * changes nothing.
 */
import globals from 'globals';
import { eslintConfigBase } from './eslint.config.base.mjs';

// Vue `<script setup>` compiler macros (was `env: { 'vue/setup-compiler-macros': true }`).
const compilerMacros = {
  defineProps:   'readonly',
  defineEmits:   'readonly',
  defineExpose:  'readonly',
  withDefaults:  'readonly',
  defineModel:   'readonly',
  defineOptions: 'readonly',
  defineSlots:   'readonly',
};

export default [
  // Ported from `.eslintignore`.
  {
    ignores: [
      '**/coverage/',
      '**/.nyc_output/',
      '**/node_modules/',
      '**/.npm/',
      '**/.eslintcache',
      '**/.env',
      '**/.cache/',
      '**/.next/',
      '**/dist/',
      '**/dist-pkg/',
      '**/.DS_Store',
      'shell/utils/dynamic-importer.js',
      '**/ksconfig.json',
      '**/storybook-static/',
      'utils/dynamic-importer.js',
      'shell/assets/fonts/',
      'assets/fonts/',
      'shell/pkg/import.js',
      'shell/types/shell/index.d.ts',
      '**/build/',
      '**/public/',
      'pkg/**/node_modules/',
      '**/elemental-ui/',
      '**/kubewarden-ui/',
      'styleguide/src/stories/Example/',
      'storybook/src/stories/Example/',
      'cypress/dist/',
      'cypress/bin/',
      'cypress/template/',
    ],
  },

  ...eslintConfigBase,

  // Root-level globals (was `.eslintrc.js` env: jest + vue/setup-compiler-macros).
  {
    languageOptions: {
      globals: {
        ...globals.jest,
        ...compilerMacros,
      },
    },
  },

  // Root rule overrides (was `.eslintrc.js` rules).
  {
    rules: {
      'jest/no-commented-out-tests': 'off',
      'jest/no-disabled-tests':      'off',
      'dot-notation':                'off',
      'generator-star-spacing':      'off',
      'guard-for-in':                'off',
      'linebreak-style':             'off',
      'new-cap':                     'off',
      'no-empty':                    'off',
      'no-extra-boolean-cast':       'off',
      'no-new':                      'off',
      'no-plusplus':                 'off',
      'no-useless-escape':           'off',
      strict:                        'off',
      'vue/no-unused-components':    'warn',
      curly:                         'warn',
      eqeqeq:                        'warn',
      'implicit-arrow-linebreak':    'warn',
      'no-caller':                   'warn',
      'no-cond-assign':              ['warn', 'except-parens'],
      'no-console':                  'warn',
      'no-debugger':                 'warn',
      'no-eq-null':                  'warn',
      'no-eval':                     'warn',
      'no-undef':                    'warn',
      'no-unused-vars':              'warn',
      'no-redeclare':                'off',
      '@typescript-eslint/no-redeclare': ['error'],
      'prefer-arrow-callback':                      'warn',
      'prefer-template':                            'warn',
      'vue/order-in-components':                    'off',
      'vue/no-lone-template':                       'off',
      'vue/v-slot-style':                           'off',
      'vue/component-tags-order':                   'off',
      'vue/no-mutating-props':                      'off',
      '@typescript-eslint/no-unused-vars':          'off',
      'array-callback-return':                      'off',
      'import/order':                               'off',
      'import/no-named-as-default':                 'off',
      'vue/multi-word-component-names':             'off',
      'vue/no-reserved-component-names':            'off',
      'vue/no-useless-template-attributes':         'off',
      'vue/attribute-hyphenation':                  'off',
      'vue/valid-next-tick':                        'off',
      'vue/no-computed-properties-in-data':         'off',
      'vue/no-side-effects-in-computed-properties': 'off',
      'vue/one-component-per-file':                 'off',
      'vue/no-deprecated-slot-attribute':           'off',
      'vue/v-on-event-hyphenation':                 'off',
    },
  },

  // override: *.d.ts (was overrides[0])
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-unused-vars':                    'off',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },

  // override: *.js (was overrides[1])
  {
    files: ['**/*.js'],
    rules: {
      'prefer-regex-literals':                'off',
      'vue/component-definition-name-casing': 'off',
      'no-unreachable-loop':                  'off',
      'computed-property-spacing':            'off',
    },
  },

  // override: docusaurus (was overrides[2])
  {
    files: ['docusaurus/**/*.{js,ts}'],
    rules: { 'no-use-before-define': 'off' },
  },

  // override: **/*.vue (was overrides[3])
  {
    files: ['**/*.vue'],
    rules: {
      'vue/no-v-html':                    'error',
      'vue/html-indent':                  ['error', 2],
      'vue/html-closing-bracket-newline': ['error', { singleline: 'never', multiline: 'always' }],
      'vue/html-closing-bracket-spacing': 2,
      'vue/html-end-tags':                2,
      'vue/html-quotes':                  2,
      'vue/html-self-closing':            ['error', {
        html: { void: 'never', normal: 'always', component: 'always' },
        svg:  'always',
        math: 'always',
      }],
      'vue/max-attributes-per-line': ['error', {
        singleline: { max: 1 },
        multiline:  { max: 1 },
      }],
    },
  },

  // override: shell/utils + shell/scripts (was overrides[4])
  {
    files: ['**/shell/utils/**/*.{js,ts}', '**/shell/scripts/**/*.{js,ts}'],
    rules: { '@typescript-eslint/no-empty-function': 'off' },
  },

  // override: **/*.{js,ts,vue} (was overrides[5])
  {
    files: ['**/*.{js,ts,vue}'],
    rules: {
      '@typescript-eslint/no-this-alias':   'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // override: harvester / harvester-manager (was overrides[6])
  {
    files: ['**/{harvester,harvester-manager}/**/*.{js,ts,vue}'],
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'vue/html-self-closing':                             'off',
      'vue/no-v-html':                                     'error',
    },
  },

  // override: po (was overrides[7])
  {
    files: ['**/po/**/*.{js,ts,vue}'],
    rules: { '@typescript-eslint/explicit-module-boundary-types': 'off' },
  },
];
