module.exports = {
  root:    true,
  env:     { node: true },
  extends: [
    'plugin:vue/essential',
    '@vue/standard',
    '@vue/typescript/recommended',
    '../../.eslintrc.js'
  ],
  parserOptions: { ecmaVersion: 2020 },
  rules:         { 'vue/no-mutating-props': 'warn' },
  overrides:     [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
        '**/*.spec.{j,t}s?(x)'
      ],
      env: { jest: true }
    }
  ]
};
