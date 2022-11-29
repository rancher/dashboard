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
  rules:         {
    'vue/no-mutating-props':                    'warn',
    '@typescript-eslint/no-empty-function':     ['error', { allow: ['arrowFunctions'] }],
    '@typescript-eslint/no-non-null-assertion': 'off'
  },
  settings:  { 'import/ignore': ['vue'] },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
        '**/*.spec.{j,t}s?(x)'
      ],
      env: { jest: true }
    }
  ],
  ignorePatterns: ['src/shim-tsx.d.ts', 'src/shim-vue.d.ts']
};
