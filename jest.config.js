module.exports = {
  preset:             'ts-jest',
  testEnvironment:    'jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  watchman:           false,

  // tell Jest to handle `*.vue` files
  moduleFileExtensions: ['js', 'json', 'vue', 'ts'],

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

  // Babel
  transform: {
    '^.+\\.js$':   '<rootDir>/node_modules/babel-jest', // process js with `babel-jest`
    '.*\\.(vue)$': '<rootDir>/node_modules/@vue/vue3-jest', // process `*.vue` files with `vue-jest`
    '^.+\\.vue$':  './vue3JestRegisterTs.js', // point to a  different transformer than vue-jest and call registerTs before exporting vue-jest
    '^.+\\.tsx?$': 'ts-jest', // process `*.ts` files with `ts-jest`
    '^.+\\.svg$':  '<rootDir>/svgTransform.js' // to mock `*.svg` files
  },
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],

  // Coverage
  coverageDirectory:   '<rootDir>/coverage/unit',
  coverageReporters:   ['json', 'text-summary'],
  collectCoverage:     false,
  collectCoverageFrom: [
    '<rootDir>/shell/**/*.{vue,ts,js}',
    '<rootDir>/pkg/rancher-components/src/components/**/*.{vue,ts,js}',
    '!<rootDir>/shell/scripts/',
  ],

  // Globals
  globals: { 'ts-jest': { isolatedModules: true } },
};
