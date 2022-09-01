module.exports = {
  // root: true,
  env:  {
    browser: true,
    node:    true
  },
  globals: { NodeJS: true, Timer: true },
  plugins: ['jest'],
  extends: [
    'standard',
    'eslint:recommended',
    '@nuxtjs/eslint-config-typescript',
    'plugin:cypress/recommended',
  ],
  // add your custom rules here
  rules: {
    'dot-notation':             'off',
    'generator-star-spacing':   'off',
    'guard-for-in':             'off',
    'linebreak-style':          'off',
    'new-cap':                  'off',
    'no-empty':                 'off',
    'no-extra-boolean-cast':    'off',
    'no-new':                   'off',
    'no-plusplus':              'off',
    'no-useless-escape':        'off',
    'nuxt/no-cjs-in-config':    'off',
    'semi-spacing':             'off',
    'space-in-parens':          'off',
    strict:                     'off',
    'unicorn/no-new-buffer':    'off',
    'vue/html-self-closing':    'off',
    'vue/no-unused-components': 'warn',
    'vue/no-v-html':            'off',
    'wrap-iife':                'off',

    'array-bracket-spacing':             'warn',
    'arrow-parens':                      'warn',
    'arrow-spacing':                     ['warn', { before: true, after: true }],
    'block-spacing':                     ['warn', 'always'],
    'brace-style':                       ['warn', '1tbs'],
    'comma-dangle':                      ['warn', 'only-multiline'],
    'comma-spacing':                     'warn',
    curly:                               'warn',
    eqeqeq:                              'warn',
    'func-call-spacing':                 ['warn', 'never'],
    'implicit-arrow-linebreak':          'warn',
    indent:                              ['warn', 2],
    'keyword-spacing':                   'warn',
    'lines-between-class-members':       ['warn', 'always', { exceptAfterSingleLine: true }],
    'multiline-ternary':                 ['warn', 'never'],
    'newline-per-chained-call':          ['warn', { ignoreChainWithDepth: 4 }],
    'no-caller':                         'warn',
    'no-cond-assign':                    ['warn', 'except-parens'],
    'no-console':                        'warn',
    'no-debugger':                       'warn',
    'no-eq-null':                        'warn',
    'no-eval':                           'warn',
    'no-trailing-spaces':                'warn',
    'no-undef':                          'warn',
    'no-unused-vars':                    'warn',
    // Allow overload type definitions
    'no-redeclare':                      'off',
    '@typescript-eslint/no-redeclare':   ['error'],
    'no-whitespace-before-property':     'warn',
    'object-curly-spacing':              ['warn', 'always'],
    'object-property-newline':           'warn',
    'object-shorthand':                  'warn',
    'padded-blocks':                     ['warn', 'never'],
    'prefer-arrow-callback':             'warn',
    'prefer-template':                   'warn',
    'quote-props':                       'warn',
    'rest-spread-spacing':               'warn',
    semi:                                ['warn', 'always'],
    'space-before-function-paren':       ['warn', 'never'],
    'space-infix-ops':                   'warn',
    'spaced-comment':                    'warn',
    'switch-colon-spacing':              'warn',
    'template-curly-spacing':            ['warn', 'always'],
    'yield-star-spacing':                ['warn', 'both'],

    'key-spacing':              ['warn', {
      align: {
        beforeColon: false,
        afterColon:  true,
        on:          'value',
        mode:        'minimum'
      },
      multiLine: {
        beforeColon: false,
        afterColon:  true
      },
    }],

    'object-curly-newline':          ['warn', {
      ObjectExpression:  {
        multiline:     true,
        minProperties: 3
      },
      ObjectPattern:     {
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
    }],

    'padding-line-between-statements': [
      'warn',
      {
        blankLine: 'always',
        prev:      '*',
        next:      'return',
      },
      {
        blankLine: 'always',
        prev:      'function',
        next:      'function',
      },
      // This configuration would require blank lines after every sequence of variable declarations
      {
        blankLine: 'always',
        prev:      ['const', 'let', 'var'],
        next:      '*'
      },
      {
        blankLine: 'any',
        prev:      ['const', 'let', 'var'],
        next:      ['const', 'let', 'var']
      }
    ],

    quotes: [
      'warn',
      'single',
      {
        avoidEscape:           true,
        allowTemplateLiterals: true
      },
    ],

    'space-unary-ops': [
      'warn',
      {
        words:    true,
        nonwords: false,
      }
    ],

    // FIXME: The following is disabled due to new linter and old JS code. These should all be enabled and underlying issues fixed
    'vue/order-in-components':              'off',
    'vue/no-lone-template':                 'off',
    'vue/v-slot-style':                     'off',
    'vue/component-tags-order':             'off',
    'vue/no-mutating-props':                'off',
    '@typescript-eslint/no-unused-vars':    'off',
    'array-callback-return':                'off',
    'import/order':                         'off',
    'import/no-named-as-default':           'off',
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        // FIXME: The following is disabled due to new linter and old JS code. These should all be enabled and underlying issues fixed
        'prefer-regex-literals':                'off',
        'vue/component-definition-name-casing': 'off',
        'no-unreachable-loop':                  'off',
        'computed-property-spacing':            'off',
      }
    },
    {
      files:   ['**/__tests__/*.{js,ts}'],
      // Unnecessary Jest lint rules from full recommendation
      rules:   { 'jest/prefer-expect-assertions': 'off' },
      extends: ['plugin:jest/all']
    },
    {
      files:   ['docusaurus/**/*.{js,ts}'],
      rules:   { 'no-use-before-define': 'off' },
    },
  ]
};
