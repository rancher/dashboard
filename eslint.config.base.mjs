/**
 * Shared flat-config base — the flat-config successor to the old `.eslintrc.default.js`.
 *
 * Imported by the root `eslint.config.mjs` and `pkg/rancher-components/eslint.config.mjs`
 * so both share one base (mirroring the legacy `extends: ['../../.eslintrc.default.js']`).
 *
 * `standard` + `@vue/standard` (capped at eslint 8, no flat release) are replaced by their
 * flat successor `neostandard`. The import rules that `eslint-config-standard` used to
 * provide are re-added explicitly, since `neostandard` drops the `import` plugin.
 */
import js from '@eslint/js';
import globals from 'globals';
import neostandard from 'neostandard';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import pluginCypress from 'eslint-plugin-cypress/flat';
import pluginJest from 'eslint-plugin-jest';
import pluginImport from 'eslint-plugin-import';
import pluginNode from 'eslint-plugin-node';
import vueParser from 'vue-eslint-parser';
import localRules from 'eslint-plugin-local-rules';

// The `standard` import rules that `neostandard` no longer pulls in.
const standardImportRules = {
  'import/export':                 'error',
  'import/first':                  'error',
  'import/no-absolute-path':       ['error', { esmodule: true, commonjs: true, amd: false }],
  'import/no-duplicates':          'error',
  'import/no-named-default':       'error',
  'import/no-webpack-loader-syntax': 'error',
};

export const testFiles = [
  '**/*.test.{js,ts}',
  '**/__tests__/**/*.{js,ts}',
  '**/__mocks__/**/*.{js,ts}',
];

/**
 * Base flat config (was `.eslintrc.default.js`). Order mirrors the legacy `extends` chain:
 *   eslint:recommended -> standard(+@vue/standard via neostandard) ->
 *   @typescript-eslint/recommended -> vue/vue3-recommended -> cypress/recommended ->
 *   local-rules/all, then the custom rule block + per-file overrides.
 */
export const eslintConfigBase = [
  // Match the legacy lint scope. The old scripts used `--ext .js,.ts,.vue`, and eslintrc
  // ignored dotfiles/dot-directories by default — flat config does neither, so replicate:
  //   - only lint .js/.ts/.vue (ignore .tsx/.jsx/.mjs/.cjs, incl. these config files),
  //   - ignore dotfiles & dot-directories (.github, .storybook, .vscode, ...).
  {
    ignores: [
      '**/*.tsx',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.cjs',
      '**/.*',
      '**/.*/**',
    ],
  },

  // Flat config defaults `reportUnusedDisableDirectives` to "warn"; the legacy eslintrc
  // setup left it off. Keep it off to preserve the pre-migration behaviour.
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },

  // eslint:recommended
  js.configs.recommended,

  // standard + @vue/standard (flat successor). `noStyle: true` keeps neostandard's quality
  // rules but omits its `@stylistic/*` layer: those rules are TypeScript-aware and would
  // flag type-syntax (type-literal braces, `interface X{`, parens around `as` casts) that
  // the legacy eslint-config-standard *core* formatting rules never checked. Formatting is
  // instead provided below by the same core rules the legacy config used (JS-only) — an
  // exact behavioural match that keeps the codebase green without source changes.
  ...neostandard({ ts: true, noStyle: true, noJsx: true }),

  // @typescript-eslint/recommended
  ...tseslint.configs.recommended,

  // vue/vue3-recommended (flat naming: `flat/recommended` === Vue 3 recommended)
  ...pluginVue.configs['flat/recommended'],

  // cypress/recommended
  pluginCypress.configs.recommended,

  // Plugin registration (so namespaces resolve, incl. inline `eslint-disable node/*`
  // directives that survive from before standard switched `node` -> `n`), language
  // options and the parser the dropped `@vue/typescript/recommended` used to configure.
  {
    plugins: {
      jest:          pluginJest,
      import:        pluginImport,
      node:          pluginNode,
      'local-rules': localRules,
    },
    languageOptions: {
      parser:       vueParser,
      ecmaVersion:  2020,
      sourceType:   'module',
      parserOptions: {
        parser:              tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        NodeJS:                'readonly',
        Timer:                 'readonly',
        WebpackRequireContext: 'readonly',
      },
    },
  },

  // local-rules/all
  { rules: { 'local-rules/v-clean-tooltip': 'error' } },

  // --- custom rule block (ported verbatim from `.eslintrc.default.js`) ---
  {
    rules: {
      ...standardImportRules,
      'import/order':               'off',
      'import/no-named-as-default':  'off',

      // --- ESLint v9 / typescript-eslint v8 upgrade compatibility ---
      // Disabled (config-only, no source changes) to preserve the pre-upgrade green state.
      '@typescript-eslint/no-require-imports':      'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-unused-expressions':   'off',
      'no-unsafe-optional-chaining':                'off',
      'no-import-assign':                           'off',
      'no-constant-binary-expression':              'off',
      'n/no-deprecated-api':                        'off',
      'n/no-callback-literal':                      'off',
      'cypress/unsafe-to-chain-command':            'off',
      camelcase:                                    'off',
      // --- end upgrade compatibility block ---

      // --- ESLint 10 / eslint-plugin-vue 10 ruleset churn ---
      // Rules newly added to recommended by the eslint 9->10 + vue 9->10 bump. Disabled
      // (config-only, no source changes) to preserve the green state, same as the block above.
      'no-useless-assignment':             'off', // new in eslint 10 recommended
      'preserve-caught-error':             'off', // new in eslint 10 recommended
      'vue/no-required-prop-with-default':  'off', // new in eslint-plugin-vue 10 recommended
      'vue/require-default-prop':           'off', // re-fires under eslint-plugin-vue 10
      // --- end eslint 10 / vue 10 churn block ---

      // Core formatting rules — values captured verbatim from the pre-migration
      // (`eslint-config-standard` + legacy overrides) resolved config. Core rules are
      // JS-only, exactly matching the previous behaviour (see `noStyle` note above).
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

      'vue/one-component-per-file':       'off',
      'vue/no-deprecated-slot-attribute': 'off',
      'vue/require-explicit-emits':       'error',
      'vue/v-on-event-hyphenation':       'off',
    },
  },

  // override: **/*.{js,ts,vue} (was `.eslintrc.default.js` overrides[0])
  {
    files: ['**/*.{js,ts,vue}'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      // `@typescript-eslint/ban-types` was split in ts-eslint v8; disable successors.
      '@typescript-eslint/no-empty-object-type':   'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-restricted-types':     'off',
      'vue/require-toggle-inside-transition':       'off',
    },
  },

  // override: test files — jest recommended + jest globals (was overrides[1])
  {
    files:           testFiles,
    ...pluginJest.configs['flat/recommended'],
    languageOptions: { globals: { ...globals.jest } },
    rules:           {
      ...pluginJest.configs['flat/recommended'].rules,
      '@typescript-eslint/no-empty-function':              'off',
      '@typescript-eslint/no-non-null-assertion':          'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'jest/prefer-expect-assertions':                     'off',
      'jest/expect-expect':                                ['warn', { assertFunctionNames: ['expect', 'test*'] }],
    },
  },

  // override: **/*.{js,vue} (was overrides[2])
  {
    files: ['**/*.{js,vue}'],
    rules: { '@typescript-eslint/explicit-module-boundary-types': 'off' },
  },
];

export default eslintConfigBase;
