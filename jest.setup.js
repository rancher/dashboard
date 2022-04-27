import { config } from '@vue/test-utils';

config.mocks['$store'] = { getters: { 'i18n/t': jest.fn() } };

/**
 * Global configuration for Jest tests
 */
beforeAll(() => {
});

/**
 * Common initialization for each test, required for resetting states
 */
beforeEach(() => {

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
