module.exports = {
  env: {
    browser: true,
    node:    true
  },
  globals: {
    NodeJS: true,
    Timer:  true
  },
  plugins: [
    'jest',
    '@typescript-eslint',
    'local-rules'
  ],
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    '@vue/standard',
    '@vue/typescript/recommended',
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
    indent:          [
      'warn',
      2
    ],
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
    semi:                  [
      'warn',
      'always'
    ],
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
    'key-spacing': [
      'warn',
      {
        align: {
          beforeColon: false,
          afterColon:  true,
          on:          'value',
          mode:        'strict'
        },
        multiLine: {
          beforeColon: false,
          afterColon:  true
        }
      }
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
        '@typescript-eslint/ban-types':         'off'
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
        'jest/prefer-expect-assertions':                     'off'
      },
      extends: [
        'plugin:jest/all'
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
