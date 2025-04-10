module.exports = {
  root:    true,
  env:     { node: true },
  extends: [
    '../../.eslintrc.default.js'
  ],
  parserOptions: { ecmaVersion: 2020 },
  rules:         {
    'vue/no-mutating-props':                'warn',
    '@typescript-eslint/no-empty-function': [
      'error',
      {
        allow: [
          'arrowFunctions'
        ]
      }
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
    'vue/multi-word-component-names':           'off',
    '@typescript-eslint/ban-ts-comment':        [
      'error',
      { 'ts-nocheck': false }
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern:         '^_',
        varsIgnorePattern:         '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    'vue/one-component-per-file':       'off',
    'vue/no-deprecated-slot-attribute': 'off',
    'vue/require-explicit-emits':       'off',
    'vue/v-on-event-hyphenation':       'off'
  },
  settings: {
    'import/ignore': [
      'vue'
    ]
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/__mocks__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
        '**/*.spec.{j,t}s?(x)'
      ],
      env: { jest: true }
    }
  ],
  ignorePatterns: [
    'src/shim-tsx.d.ts',
    'src/shim-vue.d.ts'
  ]
};
