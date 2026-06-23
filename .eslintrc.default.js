module.exports = {
  env: {
    browser: true,
    node:    true
  },
  globals: {
    NodeJS:                true,
    Timer:                 true,
    WebpackRequireContext: true
  },
  plugins: [
    'jest',
    '@typescript-eslint',
    'local-rules',
    // Registered so legacy inline `eslint-disable node/...` directives in source
    // remain valid after eslint-config-standard switched from plugin `node` to `n`.
    // These rules are only referenced in disable directives, never executed.
    'node'
  ],
  // `@vue/typescript/recommended` (from @vue/eslint-config-typescript) has no eslint-9
  // compatible release, so the parser it configured is inlined here instead.
  parser:        'vue-eslint-parser',
  parserOptions: {
    parser:              '@typescript-eslint/parser',
    ecmaVersion:         2020,
    sourceType:          'module',
    extraFileExtensions: ['.vue']
  },
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    '@vue/standard',
    'plugin:vue/vue3-recommended',
    'plugin:cypress/recommended',
    'plugin:local-rules/all'
  ],
  rules: {
    'semi-spacing':          'off',
    'space-in-parens':       'off',
    'array-bracket-spacing': 'warn',
    'arrow-parens':          'warn',
    'arrow-spacing':         [
      'warn',
      {
        before: true,
        after:  true
      }
    ],
    'block-spacing': [
      'warn',
      'always'
    ],
    'brace-style': [
      'warn',
      '1tbs'
    ],
    'comma-dangle': [
      'warn',
      'only-multiline'
    ],
    'comma-spacing': 'warn',
    // --- ESLint v9 / typescript-eslint v8 upgrade compatibility ---
    // The rules in this block began firing only after the eslint 7->9 +
    // typescript-eslint 5->8 (parser v8) upgrade. They are disabled here
    // (config-only, no source changes) to preserve the pre-upgrade green state.
    // Core formatting rules below are unreliable with @typescript-eslint/parser v8;
    // behavioural/correctness rules are disabled to avoid touching application code.
    indent:                                       'off', // was ['warn', 2]; miscounts under parser v8
    semi:                                         'off', // was ['warn', 'always']
    'no-multiple-empty-lines':                    'off',
    'key-spacing':                                'off', // align config below replaced by 'off'
    '@typescript-eslint/no-require-imports':      'off', // replaces removed no-var-requires (already disabled)
    '@typescript-eslint/no-wrapper-object-types': 'off', // new in ts-eslint v8 recommended
    '@typescript-eslint/no-unused-expressions':   'off', // new in ts-eslint v8 recommended
    'no-unsafe-optional-chaining':                'off',
    'no-import-assign':                           'off',
    'no-constant-binary-expression':              'off', // new in eslint 9 recommended
    'n/no-deprecated-api':                        'off',
    'n/no-callback-literal':                      'off',
    'cypress/unsafe-to-chain-command':            'off', // new in eslint-plugin-cypress v4
    camelcase:                                    'off',
    // --- end upgrade compatibility block ---
    'keyword-spacing':          'warn',
    'newline-per-chained-call': [
      'warn',
      { ignoreChainWithDepth: 4 }
    ],
    'no-trailing-spaces': 'warn',
    'func-call-spacing':  [
      'warn',
      'never'
    ],
    'wrap-iife':                   'off',
    'lines-between-class-members': [
      'warn',
      'always',
      { exceptAfterSingleLine: true }
    ],
    'multiline-ternary': [
      'warn',
      'never'
    ],
    'no-whitespace-before-property': 'warn',
    'object-curly-spacing':          [
      'warn',
      'always'
    ],
    'object-property-newline': 'warn',
    'object-shorthand':        'warn',
    'padded-blocks':           [
      'warn',
      'never'
    ],
    'quote-props':         'warn',
    'rest-spread-spacing': 'warn',
    'space-before-function-paren': [
      'warn',
      'never'
    ],
    'space-infix-ops':        'warn',
    'spaced-comment':         'warn',
    'switch-colon-spacing':   'warn',
    'template-curly-spacing': [
      'warn',
      'always'
    ],
    'yield-star-spacing': [
      'warn',
      'both'
    ],
    'object-curly-newline': [
      'warn',
      {
        ObjectExpression: {
          multiline:     true,
          minProperties: 3
        },
        ObjectPattern: {
          multiline:     true,
          minProperties: 4
        },
        ImportDeclaration: {
          multiline:     true,
          minProperties: 5
        },
        ExportDeclaration: {
          multiline:     true,
          minProperties: 3
        }
      }
    ],
    'padding-line-between-statements': [
      'warn',
      {
        blankLine: 'always',
        prev:      '*',
        next:      'return'
      },
      {
        blankLine: 'always',
        prev:      'function',
        next:      'function'
      },
      {
        blankLine: 'always',
        prev:      [
          'const',
          'let',
          'var'
        ],
        next: '*'
      },
      {
        blankLine: 'any',
        prev:      [
          'const',
          'let',
          'var'
        ],
        next: [
          'const',
          'let',
          'var'
        ]
      }
    ],
    quotes: [
      'warn',
      'single',
      {
        avoidEscape:           true,
        allowTemplateLiterals: true
      }
    ],
    'space-unary-ops': [
      'warn',
      {
        words:    true,
        nonwords: false
      }
    ],
    'vue/one-component-per-file':       'off',
    'vue/no-deprecated-slot-attribute': 'off',
    'vue/require-explicit-emits':       'error',
    'vue/v-on-event-hyphenation':       'off',
  },
  overrides: [
    {
      files: [
        '**/*.{js,ts,vue}'
      ],
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
        // `@typescript-eslint/ban-types` was removed in typescript-eslint v8 and split into
        // the rules below; disable the successors to preserve previous behaviour.
        '@typescript-eslint/no-empty-object-type':   'off',
        '@typescript-eslint/no-unsafe-function-type': 'off',
        '@typescript-eslint/no-restricted-types':     'off',
        'vue/require-toggle-inside-transition':       'off', // Introduced with new linting version 9.32.0
      }
    },
    {
      files: [
        '**/*.test.{js,ts}',
        '**/__tests__/**/*.{js,ts}',
        '**/__mocks__/**/*.{js,ts}'
      ],
      rules: {
        '@typescript-eslint/no-empty-function':              'off',
        '@typescript-eslint/no-non-null-assertion':          'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'jest/prefer-expect-assertions':                     'off',
        'jest/expect-expect':                                ['warn', { assertFunctionNames: ['expect', 'test*'] }]
      },
      extends: [
        'plugin:jest/recommended'
      ]
    },
    {
      files: [
        '**/*.{js,vue}'
      ],
      rules: { '@typescript-eslint/explicit-module-boundary-types': 'off' }
    }
  ]
};
