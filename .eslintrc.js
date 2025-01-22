module.exports = {
  env: {
    jest:                        true,
    'vue/setup-compiler-macros': true,
  },
  extends: [
    '.eslintrc.default.js'
  ],
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
    'nuxt/no-cjs-in-config':       'off',
    strict:                        'off',
    'unicorn/no-new-buffer':       'off',
    'vue/no-unused-components':    'warn',
    curly:                         'warn',
    eqeqeq:                        'warn',
    'implicit-arrow-linebreak':    'warn',
    'no-caller':                   'warn',
    'no-cond-assign':              [
      'warn',
      'except-parens'
    ],
    'no-console':                      'warn',
    'no-debugger':                     'warn',
    'no-eq-null':                      'warn',
    'no-eval':                         'warn',
    'no-undef':                        'warn',
    'no-unused-vars':                  'warn',
    'no-redeclare':                    'off',
    '@typescript-eslint/no-redeclare': [
      'error'
    ],
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
    '@typescript-eslint/no-var-requires':         'off',
    'vue/one-component-per-file':                 'off',
    'vue/no-deprecated-slot-attribute':           'off',
    'vue/v-on-event-hyphenation':                 'off',
    'jest/no-hooks':                              'off',
  },
  overrides: [
    {
      files: [
        '*.js'
      ],
      rules: {
        'prefer-regex-literals':                'off',
        'vue/component-definition-name-casing': 'off',
        'no-unreachable-loop':                  'off',
        'computed-property-spacing':            'off'
      },
    },
    {
      files: [
        'docusaurus/**/*.{js,ts}'
      ],
      rules: { 'no-use-before-define': 'off' }
    },
    {
      files: [
        '**/*.vue'
      ],
      rules: {
        'vue/no-v-html':   'error',
        'vue/html-indent': [
          'error',
          2
        ],
        'vue/html-closing-bracket-newline': [
          'error',
          {
            singleline: 'never',
            multiline:  'always'
          }
        ],
        'vue/html-closing-bracket-spacing': 2,
        'vue/html-end-tags':                2,
        'vue/html-quotes':                  2,
        'vue/html-self-closing':            [
          'error',
          {
            html: {
              void:      'never',
              normal:    'always',
              component: 'always'
            },
            svg:  'always',
            math: 'always'
          }
        ],
        'vue/max-attributes-per-line': [
          'error',
          {
            singleline: { max: 1 },
            multiline:  { max: 1 }
          }
        ]
      }
    },
    {
      files: [
        '**/shell/utils/**/*.{js,ts}',
        '**/shell/scripts/**/*.{js,ts}'
      ],
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-var-requires':   'off'
      }
    },
    {
      files: [
        '**/*.{js,ts,vue}'
      ],
      rules: {
        '@typescript-eslint/no-this-alias':   'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    },
    {
      files: [
        '**/{harvester,harvester-manager}/**/*.{js,ts,vue}'
      ],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'vue/html-self-closing':                             'off',
        'vue/no-v-html':                                     'error'
      }
    },
    {
      files: [
        '**/po/**/*.{js,ts,vue}'
      ],
      rules: { '@typescript-eslint/explicit-module-boundary-types': 'off' }
    }
  ]
};
