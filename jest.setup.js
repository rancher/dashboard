import { config } from '@vue/test-utils';
import { directiveSsr as t } from '@/plugins/i18n';

config.mocks['$store'] = { getters: { 'i18n/t': jest.fn() } };
config.directives = { t };

// Overrides some components
// config.stubs['my-component'] = { template: "<div></div> "};

/**
 * Global configuration for Jest tests
 */
beforeAll(() => {
});

/**
 * Common initialization for each test, required for resetting states
 */
beforeEach(() => {
  // jest.resetModules(); // Use this function inside your test if you need to remove any cache stored
  // jest.clearAllMocks(); // Use this function inside your test if you need to reset mocks
});

/**
 * Clean up after each test
 */
afterEach(() => {
});

/**
 * Clean up after all tests
 */
afterAll(() => {
});
