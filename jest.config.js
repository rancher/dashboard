process.env.TZ = 'UTC';

module.exports = {
  // No `preset: 'ts-jest'` - `.ts` is transpiled by `@swc/jest` (see transform
  // below) so nothing loads the TypeScript compiler (native TS 7 ships no JS API).
  testEnvironment:    'jsdom',
  // Jest 28+ (jest-environment-jsdom) defaults package resolution to the "browser" export
  // condition, which makes packages like @vue/test-utils resolve their browser (global-Vue)
  // build and throw "Vue is not defined". Pin to node conditions to restore Jest 27 behaviour.
  testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
  setupFilesAfterEnv:     ['./jest.setup.js'],
  watchman:           false,

  // tell Jest to handle `*.vue` files
  moduleFileExtensions: ['js', 'mjs', 'json', 'vue', 'ts'],

  // Paths
  // NOTE: Docs configuration does not work for our environment
  // https://kulshekhar.github.io/ts-jest/docs/27.1/getting-started/paths-mapping#jest-config-with-helper
  modulePaths:      ['<rootDir>'],
  moduleNameMapper: {
    '^~/(.*)$':                                                                      '<rootDir>/$1',
    '^~~/(.*)$':                                                                     '<rootDir>/$1',
    '^@/(.*)$':                                                                      '<rootDir>/$1',
    '@shell/(.*)':                                                                   '<rootDir>/shell/$1',
    '@pkg/(.*)':                                                                     '<rootDir>/pkg/$1',
    '@components/(.*)':                                                              '<rootDir>/pkg/rancher-components/src/components/$1',
    // clipboard-polyfill's package `exports` only declares an `import` (ESM) condition, so Jest
    // 28+'s exports-aware resolver can't resolve it for a CJS require. Map it to its concrete ESM
    // build (transformed via transformIgnorePatterns below) to restore the Jest 27 `main` behaviour.
    '^clipboard-polyfill$':                                                          '<rootDir>/node_modules/clipboard-polyfill/dist/es6/clipboard-polyfill.es6.js',
    '\\.(jpe?g|png|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf)$': '<rootDir>/svgTransform.js',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/cypress/',
    '<rootDir>/scripts/',
    '<rootDir>/docusaurus/',
    '<rootDir>/stories/',
    '<rootDir>/shell/scripts/',
    '<rootDir>/drone',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>(/.*)*/__tests__/utils/',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(color|color-string|color-convert|color-name|vee-validate|@vee-validate|clipboard-polyfill)/)',
  ],

  // Babel
  transform: {
    '^.+\\.js$':   '<rootDir>/node_modules/babel-jest', // process js with `babel-jest`
    '^.+\\.mjs$':  '<rootDir>/node_modules/babel-jest', // process mjs (e.g. vee-validate ESM) with `babel-jest`
    // `*.vue` are handled by a custom single-pass transformer that assembles the SFC
    // and transpiles it once with Babel - no TypeScript compiler JS API (see the file).
    '^.+\\.vue$':  './vueSfcJestTransformer.js',
    // Process `*.ts`/`*.tsx` with `babel-jest` + `@babel/preset-typescript` (strips
    // types via Babel; never loads the TypeScript compiler, so it is compatible
    // with the native TS 7 package that ships no JS API). Babel replicates the
    // prior ts-jest behaviour the suite relies on: `jest.mock` hoisting (via the
    // auto-injected babel-preset-jest) and writable CommonJS exports.
    '^.+\\.tsx?$': ['@swc/jest', { // process `*.ts` files with `@swc/jest` (no TypeScript JS API dependency)
      jsc: {
        parser:    { syntax: 'typescript', tsx: true },
        target:    'es2019',
        transform: {
          // Match TypeScript `target: ES2018` (useDefineForClassFields defaults to
          // false below ES2022): class fields use assignment, and - crucially -
          // *uninitialised* fields emit nothing (so a subclass type-only field does
          // not clobber a value set by an inherited setter, and does not throw when
          // it shadows an inherited getter). Babel cannot replicate this.
          useDefineForClassFields: false
        }
        // `const enum`s are emitted as runtime enum objects (not erased), so
        // cross-module references keep working without whole-program inlining.
      },
      module:     { type: 'commonjs' },
      sourceMaps: 'inline'
    }],
    '^.+\\.svg$':  '<rootDir>/svgTransform.js' // to mock `*.svg` files
  },
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],

  // NOTE: `.ts` is transpiled by `@swc/jest` (see transform above). No `ts-jest`.
  // `.vue` files are handled by ./vueSfcJestTransformer.js (no TypeScript compiler API).

  // Coverage
  coverageProvider:    'v8',
  coverageDirectory:   '<rootDir>/coverage/unit',
  coverageReporters:   ['json', 'text-summary', 'html'],
  collectCoverage:     false,
  collectCoverageFrom: [
    '<rootDir>/shell/**/*.{vue,ts,js}',
    '<rootDir>/pkg/rancher-components/src/components/**/*.{vue,ts,js}',
    '!<rootDir>/shell/scripts/',
  ],
  coveragePathIgnorePatterns: [
    '\\.d\\.ts'
  ],

  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'unit-test-reports',
      outputName:      'unit-tests.xml'
    }
    ]
  ],
};
