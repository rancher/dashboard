module.exports = {
  root:    true,
  env:     { node: true },
  extends: [
    '../../.eslintrc.default.js'
  ],
  parserOptions: { ecmaVersion: 2020 },
  rules:         {
    '@typescript-eslint/no-non-null-assertion': 'off',
    'vue/multi-word-component-names':           'off',
    '@typescript-eslint/no-unused-vars':        [
      'warn',
      {
        argsIgnorePattern:         '^_',
        varsIgnorePattern:         '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    'vue/require-explicit-emits':       'off',
    'vue/one-component-per-file':       'off',
    'vue/no-deprecated-slot-attribute': 'off',
    'vue/v-on-event-hyphenation':       'off'
  },
  ignorePatterns: [
    'dist/**',
    'coverage/**',
    'playground/dist/**'
  ]
};
