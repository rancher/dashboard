// /* eslint-disable no-undef */
import { createApp } from 'vue';
import { config } from '@vue/test-utils';
import i18n from '@shell/plugins/i18n';
import VTooltip from 'v-tooltip';
import vSelect from 'vue-select';
import cleanTooltipDirective from '@shell/directives/clean-tooltip';
import cleanHtmlDirective from '@shell/directives/clean-html';
import '@shell/plugins/replaceall';
import { TextEncoder, TextDecoder } from 'util';

const vueApp = createApp({});

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// vueApp.config.productionTip = false;
vueApp.use(i18n, { store: { dispatch() {} } });
vueApp.use(VTooltip);
vueApp.use(VCleanTooltip);
vueApp.component('v-select', vSelect);

config.global.components['v-select'] = vSelect;
config.global.plugins = [VTooltip];
config.global.mocks['t'] = key => `%${key}%`
config.global.mocks['$store'] = {
  getters: {},
  dispatch: jest.fn(),
  commit: jest.fn(),
}
  
/**
 * Global configuration for Jest tests
 */
beforeAll(() => {
  // matchMedia and getContext methods aren't included in jest's version of jsdom for us to mock
  // implemented as per jest documentation: https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
  Object.defineProperty(window, 'matchMedia', { value: jest.fn().mockImplementation(() => ({ addListener: jest.fn() })) });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: jest.fn().mockImplementation(() => ({
      createLinearGradient: jest.fn(),
      fillRect:             jest.fn(),
      getImageData:         jest.fn(() => ({ data: [] }))
    }))
  });
});

/**
 * Common initialization for each test, required for resetting states
 */
beforeEach(() => {
  // jest.resetModules(); // Use this function inside your test if you need to remove any cache stored
  // jest.clearAllMocks(); // Use this function inside your test if you need to reset mocks
  jest.restoreAllMocks(); // Use this function inside your test if you need to reset mocks and restore existing functionality

  // Mock the $plugin object
  // config.mocks['$plugin'] = { getDynamic: () => undefined };

  config.mocks['$store'] = { getters: { 'i18n/t': jest.fn() } };
  config.global.directives['t'] = t;
  config.global.directives['clean-tooltip'] = cleanTooltipDirective ;
  config.global.directives['clean-html'] = cleanHtmlDirective;
  
  // Overrides some components
  // config.stubs['my-component'] = { template: "<div></div> "};
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
