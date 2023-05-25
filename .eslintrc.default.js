module.exports = {
  // root: true,
  env: {
    browser: true,
    node:    true
  },
  globals: { NodeJS: true, Timer: true },
  plugins: ['jest', '@typescript-eslint'],
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    '@vue/standard',
    '@vue/typescript/recommended',
    'plugin:cypress/recommended',
  ]
};
