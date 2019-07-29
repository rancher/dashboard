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
    'curly':                                      'error',
    'dot-notation':                               'off',
    'eqeqeq':                                     'error',
    'generator-star-spacing':                     'off',
    'guard-for-in':                               'off',
    'linebreak-style':                            'off',
    'new-cap':                                    'off',
    'no-caller':                                  'error',
    'no-cond-assign':                             ['error', 'except-parens'],
    'no-console':                                 'off',
    'no-debugger':                                'warn',
    'no-empty':                                   'off',
    'no-eq-null':                                 'error',
    'no-eval':                                    'error',
    'no-extra-boolean-cast':                      'off',
    'no-new':                                     'off',
    'no-plusplus':                                'off',
    'no-undef':                                   'error',
    'no-unused-vars':                             'warn',
    'no-useless-escape':                          'off',
    'strict':                                     'off',
    'wrap-iife':                                  'off',
    
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'only-multiline'],

    // stylistic
    'array-bracket-spacing':    'error',
    'padded-blocks':            ['error', 'never'],
    'block-spacing':            ['error', 'always'],
    'brace-style':              ['error', '1tbs'],
    'comma-spacing':            'error',
    'func-call-spacing':        ['error', 'never'],
    'implicit-arrow-linebreak': 'error',
    'indent':                   ['error', 2],
    'key-spacing':              ['error', {
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

    'keyword-spacing':               'error',
    'lines-between-class-members':   'error',
    'newline-per-chained-call':      ['error', { 'ignoreChainWithDepth': 4 }],
    'no-whitespace-before-property': 'error',
    'object-curly-newline':          ['error', {
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
    'object-curly-spacing':            ['error', 'always'],
    'object-property-newline':         'error',
    'padding-line-between-statements': [
      'error',
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
      'error',
      'single',
      {
        'avoidEscape':           true,
        'allowTemplateLiterals': true
      },
    ],
    'space-before-function-paren': ['error', 'never'],
    'space-infix-ops':             'error',
    'space-unary-ops':             [
      'error',
      {
        'words':    true,
        'nonwords': false,
      }
    ],
    'spaced-comment':       'error',
    'switch-colon-spacing': 'error',

    // ECMAScript 6
    'arrow-parens':           'error',
    'arrow-spacing':          ['error', {
      'before': true,
      'after':  true
    }],
    'no-trailing-spaces':     'error',
    'object-shorthand':       'error',
    'prefer-arrow-callback':  'error',
    'prefer-template':        'error',
    'rest-spread-spacing':    'error',
    'template-curly-spacing': ['error', 'always'],
    'yield-star-spacing':     ['error', 'both'],
  }
}
