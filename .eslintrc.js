module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    'eslint:recommended',
    '@nuxtjs',
    'plugin:nuxt/recommended'
  ],
  // add your custom rules here
  rules: {
    'nuxt/no-cjs-in-config': 'off',
    'vue/html-self-closing': 'off',

    // Overrides
    'curly':                                      'warn',
    'dot-notation':                               'off',
    'eqeqeq':                                     'warn',
    'generator-star-spacing':                     'off',
    'guard-for-in':                               'off',
    'linebreak-style':                            'off',
    'new-cap':                                    'off',
    'no-caller':                                  'warn',
    'no-cond-assign':                             ['warn', 'except-parens'],
    'no-console':                                 'off',
    'no-debugger':                                'warn',
    'no-empty':                                   'off',
    'no-eq-null':                                 'warn',
    'no-eval':                                    'warn',
    'no-extra-boolean-cast':                      'off',
    'no-new':                                     'off',
    'no-plusplus':                                'off',
    'no-undef':                                   'warn',
    'no-unused-vars':                             'warn',
    'no-useless-escape':                          'off',
    'strict':                                     'off',
    'wrap-iife':                                  'off',

    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'only-multiline'],

    // stylistic
    'array-bracket-spacing':    'warn',
    'padded-blocks':            ['warn', 'never'],
    'block-spacing':            ['warn', 'always'],
    'brace-style':              ['warn', '1tbs'],
    'comma-spacing':            'warn',
    'func-call-spacing':        ['warn', 'never'],
    'implicit-arrow-linebreak': 'warn',
    'indent':                   ['warn', 2],
    'key-spacing':              ['warn', {
      'align': {
        'beforeColon': false,
        'afterColon':  true,
        'on':          'value',
        'mode':        'minimum'
      },
      'multiLine': {
        'beforeColon': false,
        'afterColon':  true
      },
    }],

    'keyword-spacing':               'warn',
    'lines-between-class-members':   'warn',
    'newline-per-chained-call':      ['warn', { 'ignoreChainWithDepth': 4 }],
    'no-whitespace-before-property': 'warn',
    'object-curly-newline':          ['warn', {
      'ObjectExpression':  {
        'multiline':     true,
        'minProperties': 3
      },
      'ObjectPattern':     {
        'multiline':     true,
        'minProperties': 4
      },
      'ImportDeclaration': {
        'multiline':     true,
        'minProperties': 5
      },
      'ExportDeclaration': {
        'multiline':     true,
        'minProperties': 3
      }
    }],
    'object-curly-spacing':            ['warn', 'always'],
    'object-property-newline':         'warn',
    'padding-line-between-statements': [
      'warn',
      {
        'blankLine': 'always',
        'prev':      '*',
        'next':      'return',
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
        'avoidEscape':           true,
        'allowTemplateLiterals': true
      },
    ],
    'space-before-function-paren': ['warn', 'never'],
    'space-infix-ops':             'warn',
    'space-unary-ops':             [
      'warn',
      {
        'words':    true,
        'nonwords': false,
      }
    ],
    'space-in-parens':      'off',
    'spaced-comment':       'warn',
    'switch-colon-spacing': 'warn',

    'semi-spacing': 'off',

    // ECMAScript 6
    'arrow-parens':           'warn',
    'arrow-spacing':          ['warn', {
      'before': true,
      'after':  true
    }],
    'no-trailing-spaces':     'warn',
    'object-shorthand':       'warn',
    'prefer-arrow-callback':  'warn',
    'prefer-template':        'warn',
    'rest-spread-spacing':    'warn',
    'template-curly-spacing': ['warn', 'always'],
    'yield-star-spacing':     ['warn', 'both'],
  }
}
