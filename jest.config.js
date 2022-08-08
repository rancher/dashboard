module.exports = {
  testEnvironment:              'jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  modulePaths:                  [
    '<rootDir>'
  ],
  // tell Jest to handle `*.vue` files
  moduleFileExtensions: ['js', 'json', 'vue', 'ts'],
  watchman:             false,
  moduleNameMapper:     {
    '^~/(.*)$':         '<rootDir>/$1',
    '^~~/(.*)$':        '<rootDir>/$1',
    '^@/(.*)$':         '<rootDir>/$1',
    '@shell/(.*)':      '<rootDir>/shell/$1',
    '@pkg/(.*)':        '<rootDir>/shell/pkg/$1',
    '@components/(.*)': '<rootDir>/pkg/rancher-components/src/components/$1',
  },
  transform: {
    // process js with `babel-jest`
    '^.+\\.js$':   '<rootDir>/node_modules/babel-jest',
    // process `*.vue` files with `vue-jest`
    '.*\\.(vue)$': '<rootDir>/node_modules/@vue/vue2-jest',
    // process `*.ts` files with `ts-jest`
    '^.+\\.tsx?$': 'ts-jest'
  },
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],
  collectCoverage:     false,
  collectCoverageFrom: [
    '<rootDir>/shell/**/*.{vue,ts,js}',
    '<rootDir>/pkg/rancher-components/src/components/**/*.{vue,ts,js}',
    // '!<rootDir>/components/RancherProviderIcon.vue',
  ],
  modulePathIgnorePatterns: ['<rootDir>/cypress/'],
  coverageDirectory:        '<rootDir>/coverage',
  coverageReporters:        ['html', 'text'],
  globals:                  { 'ts-jest': { isolatedModules: true } },
  preset:                   'ts-jest'
};
