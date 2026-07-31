process.env.TZ = 'UTC';

module.exports = {
  preset:             'ts-jest',
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
    // `*.vue` goes through the local wrapper, which re-exports `@vue/vue3-jest` after
    // registering TypeScript with `@vue/compiler-sfc` and repairing its template
    // transform (see the file). A second `.*\.(vue)$` entry pointing straight at
    // `@vue/vue3-jest` used to sit above this one and shadowed it - Jest takes the first
    // matching pattern - so the wrapper never ran.
    '^.+\\.vue$':  './vue3JestRegisterTs.js',
    '^.+\\.tsx?$': 'ts-jest', // process `*.ts` files with `ts-jest`
    '^.+\\.svg$':  '<rootDir>/svgTransform.js' // to mock `*.svg` files
  },
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],

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

  // Globals
  globals: { 'ts-jest': { isolatedModules: true } },
};
