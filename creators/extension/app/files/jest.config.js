const path = require('path');

process.env.TZ = 'UTC';

// Runs each file through the transformer named in its options after turning the shell's `import.meta.glob()` calls,
// which Jest's CommonJS modules do not support, into `require()`s
const SHELL_TRANSFORMER = '@rancher/shell/vite/jest-transformer.js';

module.exports = {
  testEnvironment:        'jsdom',
  // Jest 28+ (jest-environment-jsdom) defaults package resolution to the "browser" export
  // condition, which makes packages like @vue/test-utils resolve their browser (global-Vue)
  // build and throw "Vue is not defined". Pin to node conditions to restore Jest 27 behaviour.
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  setupFilesAfterEnv:     ['<rootDir>/jest.setup.js'],
  watchman:               false,

  moduleFileExtensions: ['js', 'mjs', 'ts', 'json', 'vue'],

  modulePaths:      ['<rootDir>'],
  moduleNameMapper: {
    '^~/(.*)$':                                                                      '<rootDir>/$1',
    '^@/(.*)$':                                                                      '<rootDir>/$1',
    '^@pkg/(.*)$':                                                                   '<rootDir>/pkg/$1',
    '^@shell/(.*)\\?worker&inline$':                                                 '<rootDir>/node_modules/@rancher/shell/$1',
    '^@shell/(.*)$':                                                                 '<rootDir>/node_modules/@rancher/shell/$1',
    '^@components/(.*)$':                                                            '<rootDir>/node_modules/@rancher/shell/rancher-components/$1',
    // Virtual module created by the build - see autoImportStub.js
    '^@rancher/auto-import$':                                                        '<rootDir>/autoImportStub.js',
    '\\.(jpe?g|png|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf)$': '<rootDir>/svgTransform.js',
  },

  modulePathIgnorePatterns: ['<rootDir>/cypress/', '<rootDir>/dist-pkg/'],

  transform: {
    '^.+\\.vue$':    [SHELL_TRANSFORMER, { transformer: path.join(__dirname, 'vue3JestRegisterTs.js') }],
    // `sourceMap` - the scaffold's tsconfig turns source maps off, which makes @vue/vue3-jest hand
    // @babel/core an empty `inputSourceMap` that newer Babel versions reject. Re-enable for Jest only.
    // `isolatedModules` - skip full type checking during test runs; `yarn lint` / `tsc` cover that.
    '^.+\\.tsx?$':   [SHELL_TRANSFORMER, { transformer: 'ts-jest', options: { tsconfig: { sourceMap: true, isolatedModules: true } } }],
    '^.+\\.m?jsx?$': [SHELL_TRANSFORMER, {
      transformer: 'babel-jest',
      options:     {
        configFile: false,
        presets:    [['@babel/preset-env', { targets: { node: 'current' } }]]
      }
    }],
    '^.+\\.svg$': '<rootDir>/svgTransform.js'
  },

  // Most of node_modules ships CommonJS and does not need transforming. These packages (pulled in
  // by @rancher/shell) are ESM-only, so Jest has to transpile them instead of skipping them.
  transformIgnorePatterns: [
    '/node_modules/(?!(@rancher/shell|color|color-string|color-convert|color-name|vee-validate|@vee-validate|clipboard-polyfill|intl-messageformat|@formatjs|@replit/codemirror-vim-core)/)',
  ],

  testMatch: ['**/__tests__/**/*.test.ts'],

  coverageProvider:    'v8',
  coverageDirectory:   '<rootDir>/coverage/unit',
  coverageReporters:   ['json', 'text-summary', 'html'],
  collectCoverage:     false,
  collectCoverageFrom: ['<rootDir>/pkg/**/*.{vue,ts,js}'],
};
