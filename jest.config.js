module.exports = {
  testEnvironment:    'jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  modulePaths:        [
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
    '@pkg/(.*)':        '<rootDir>/pkg/$1',
    '@components/(.*)': '<rootDir>/pkg/rancher-components/src/components/$1',
  },
  transform: {
    '^.+\\.js$':   '<rootDir>/node_modules/babel-jest', // process js with `babel-jest`
    '.*\\.(vue)$': '<rootDir>/node_modules/@vue/vue2-jest', // process `*.vue` files with `vue-jest`
    '^.+\\.tsx?$': 'ts-jest', // process `*.ts` files with `ts-jest`
    '^.+\\.svg$':  '<rootDir>/svgTransform.js' // to mock `*.svg` files
  },
  snapshotSerializers: ['<rootDir>/node_modules/jest-serializer-vue'],
  collectCoverage:     false,
  collectCoverageFrom: [
    '<rootDir>/shell/**/*.{vue,ts,js}',
    '<rootDir>/pkg/rancher-components/src/components/**/*.{vue,ts,js}',
    '!<rootDir>/shell/scripts/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/cypress/',
    '<rootDir>/scripts/',
    '<rootDir>/docusaurus/',
    '<rootDir>/stories/',
    '<rootDir>/shell/scripts/',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>(/.*)*/__tests__/utils/',
  ],
  coverageDirectory: '<rootDir>/coverage/unit',
  coverageReporters: ['json', 'text-summary'],
  globals:           {
    'ts-jest': {
      isolatedModules: true,
      tsconfig:        'tsconfig.test.json'
    }
  },
  preset: 'ts-jest'
};
