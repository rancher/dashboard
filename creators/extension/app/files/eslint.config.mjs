/**
 * Flat ESLint config for a Rancher UI extension (scaffolding template — successor to the old
 * standalone `.eslintrc.js`). Self-contained: the eslint toolchain (eslint, neostandard,
 * typescript-eslint, eslint-plugin-vue, vue-eslint-parser, eslint-plugin-cypress, ...) is
 * provided transitively by `@rancher/shell`.
 *
 * `standard` + `@vue/standard` (capped at eslint 8, no flat release) are replaced by their flat
 * successor `neostandard`. `neostandard`'s `@stylistic/*` rules are TypeScript-aware and would
 * flag type-syntax the old core formatting rules never checked, so `noStyle: true` is used and
 * formatting is provided by the (JS-only) core rules below — matching the previous behaviour.
 */
import js from '@eslint/js';
import globals from 'globals';
import neostandard from 'neostandard';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import pluginCypress from 'eslint-plugin-cypress/flat';
import pluginImport from 'eslint-plugin-import';
import vueParser from 'vue-eslint-parser';

export default [
  {
    ignores: [
      '**/*.tsx',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.cjs',
      '**/.*',
      '**/.*/**',
      '**/node_modules/',
      '**/dist/',
      '**/dist-pkg/',
      '**/coverage/',
    ],
  },

  // Flat config defaults `reportUnusedDisableDirectives` to "warn"; eslintrc left it off.
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },

  // eslint:recommended
  js.configs.recommended,

  // standard + @vue/standard (flat successor); see `noStyle` note above.
  ...neostandard({ ts: true, noStyle: true, noJsx: true }),

  // @typescript-eslint/recommended
  ...tseslint.configs.recommended,

  // vue/vue3-recommended (flat naming: `flat/recommended` === Vue 3 recommended)
  ...pluginVue.configs['flat/recommended'],

  // cypress/recommended
  pluginCypress.configs.recommended,

  // Parser + globals (the parser the dropped `@vue/typescript/recommended` used to configure).
  {
    plugins: { import: pluginImport },
    languageOptions: {
      parser:      vueParser,
      ecmaVersion: 2020,
      sourceType:  'module',
      parserOptions: {
        parser:              tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        NodeJS: 'readonly',
        Timer:  'readonly',
      },
    },
  },

  {
    rules: {
      // `standard` import rules that neostandard no longer pulls in.
      'import/export':                   'error',
      'import/first':                    'error',
      'import/no-absolute-path':         ['error', { esmodule: true, commonjs: true, amd: false }],
      'import/no-duplicates':            'error',
      'import/no-named-default':         'error',
      'import/no-webpack-loader-syntax': 'error',

      'dot-notation':           'off',
      'generator-star-spacing': 'off',
      'guard-for-in':           'off',
      'linebreak-style':        'off',
      'new-cap':                'off',
      'no-empty':               'off',
      'no-extra-boolean-cast':  'off',
      'no-new':                 'off',
      'no-plusplus':            'off',
      'no-useless-escape':      'off',
      'semi-spacing':           'off',
      'space-in-parens':        'off',
      strict:                   'off',
      'wrap-iife':              'off',
      curly:                    'warn',
      eqeqeq:                   'warn',
      'no-caller':              'warn',
      'no-cond-assign':         ['warn', 'except-parens'],
      'no-console':             'warn',
      'no-debugger':            'warn',
      'no-eq-null':             'warn',
      'no-eval':                'warn',
      'no-undef':               'warn',
      'no-unused-vars':         'warn',
      'prefer-arrow-callback':  'warn',
      'prefer-template':        'warn',
      'array-callback-return':  'off',
      '@typescript-eslint/no-unused-vars':     'off',
      '@typescript-eslint/no-require-imports': 'off', // replaces removed no-var-requires

      // --- ESLint 10 / eslint-plugin-vue 10 ruleset churn (disabled to preserve prior behaviour) ---
      'no-useless-assignment':             'off',
      'preserve-caught-error':             'off',
      'vue/no-required-prop-with-default': 'off',
      'vue/require-default-prop':          'off',

      // Core formatting rules (JS-only; see `noStyle` note). This template keeps `indent`,
      // `semi` and `key-spacing` enabled (stricter than the monorepo, which disabled them).
      indent:                        ['warn', 2],
      semi:                          ['warn', 'always'],
      'key-spacing':                 ['warn', {
        align:     { beforeColon: false, afterColon: true, on: 'value', mode: 'minimum' },
        multiLine: { beforeColon: false, afterColon: true },
      }],
      'array-bracket-spacing':       ['warn', 'never'],
      'arrow-parens':                ['warn'],
      'arrow-spacing':               ['warn', { before: true, after: true }],
      'block-spacing':               ['warn', 'always'],
      'brace-style':                 ['warn', '1tbs'],
      'comma-dangle':                ['warn', 'only-multiline'],
      'comma-spacing':               ['warn', { before: false, after: true }],
      'comma-style':                 ['error', 'last'],
      'computed-property-spacing':   ['error', 'never', { enforceForClassMembers: true }],
      'dot-location':                ['error', 'property'],
      'eol-last':                    ['error'],
      'func-call-spacing':           ['warn', 'never'],
      'implicit-arrow-linebreak':    ['warn'],
      'keyword-spacing':             ['warn', { before: true, after: true }],
      'lines-between-class-members': ['warn', 'always', { exceptAfterSingleLine: true }],
      'multiline-ternary':           ['warn', 'never'],
      'new-parens':                  ['error'],
      'newline-per-chained-call':    ['warn', { ignoreChainWithDepth: 4 }],
      'no-extra-parens':             ['error', 'functions'],
      'no-floating-decimal':         ['error'],
      'no-mixed-operators':          ['error', {
        allowSamePrecedence: true,
        groups:              [['==', '!=', '===', '!==', '>', '>=', '<', '<='], ['&&', '||'], ['in', 'instanceof']],
      }],
      'no-mixed-spaces-and-tabs':      ['error'],
      'no-multi-spaces':               ['error'],
      'no-tabs':                       ['error'],
      'no-trailing-spaces':            ['warn'],
      'no-whitespace-before-property': ['warn'],
      'object-curly-newline':          ['warn', {
        ObjectExpression:  { multiline: true, minProperties: 3 },
        ObjectPattern:     { multiline: true, minProperties: 4 },
        ImportDeclaration: { multiline: true, minProperties: 5 },
        ExportDeclaration: { multiline: true, minProperties: 3 },
      }],
      'object-curly-spacing':    ['warn', 'always'],
      'object-property-newline': ['warn', { allowAllPropertiesOnSameLine: false, allowMultiplePropertiesPerLine: true }],
      'object-shorthand':        'warn',
      'operator-linebreak':      ['error', 'after', { overrides: { '?': 'before', ':': 'before', '|>': 'before' } }],
      'padded-blocks':           ['warn', 'never'],
      'padding-line-between-statements': ['warn',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'function', next: 'function' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
      ],
      'quote-props':                 ['warn', 'as-needed'],
      quotes:                        ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'rest-spread-spacing':         ['warn', 'never'],
      'space-before-blocks':         ['error', 'always'],
      'space-before-function-paren': ['warn', 'never'],
      'space-infix-ops':             ['warn'],
      'space-unary-ops':             ['warn', { words: true, nonwords: false }],
      'spaced-comment':              ['warn', 'always', {
        line:  { markers: ['*package', '!', '/', ',', '='] },
        block: { balanced: true, markers: ['*package', '!', ',', ':', '::', 'flow-include'], exceptions: ['*'] },
      }],
      'switch-colon-spacing':   ['warn'],
      'template-curly-spacing': ['warn', 'always'],
      'template-tag-spacing':   ['error', 'never'],
      'yield-star-spacing':     ['warn', 'both'],

      // Vue rule tweaks (from the old template).
      'vue/html-self-closing':            'off',
      'vue/no-unused-components':         'warn',
      'vue/no-v-html':                    'error',
      'vue/order-in-components':          'off',
      'vue/no-lone-template':             'off',
      'vue/v-slot-style':                 'off',
      'vue/component-tags-order':         'off',
      'vue/no-mutating-props':            'off',
      'vue/one-component-per-file':       'off',
      'vue/no-deprecated-slot-attribute': 'off',
      'vue/require-explicit-emits':       'off',
      'vue/v-on-event-hyphenation':       'off',
    },
  },

  // override: *.js
  {
    files: ['**/*.js'],
    rules: {
      'prefer-regex-literals':                'off',
      'vue/component-definition-name-casing': 'off',
      'no-unreachable-loop':                  'off',
      'computed-property-spacing':            'off',
    },
  },
];
