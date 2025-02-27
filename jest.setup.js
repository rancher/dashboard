// /* eslint-disable no-undef */
import { createApp } from 'vue';
import { config } from '@vue/test-utils';
import i18n from '@shell/plugins/i18n';
import FloatingVue from 'floating-vue';
import { floatingVueOptions } from '@shell/plugins/floating-vue';
import vSelect from 'vue-select';
import cleanTooltipDirective from '@shell/directives/clean-tooltip';
import cleanHtmlDirective from '@shell/directives/clean-html';
import htmlStrippedAriaLabelDirective from '@shell/directives/strip-html-aria-label';
import '@shell/plugins/replaceall';
import { TextEncoder, TextDecoder } from 'util';

const vueApp = createApp({});

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// vueApp.config.productionTip = false;
vueApp.use(i18n, { store: { dispatch() {} } });
vueApp.use(FloatingVue, floatingVueOptions);
vueApp.directive('clean-html', cleanHtmlDirective);
vueApp.directive('clean-tooltip', cleanTooltipDirective);
vueApp.component('v-select', vSelect);

config.global.components['v-select'] = vSelect;
config.global.plugins = [FloatingVue];
config.global.mocks['t'] = (key) => `%${ key }%`;
config.global.mocks['$store'] = {
  getters:  {},
  dispatch: jest.fn(),
  commit:   jest.fn(),
};

config.global.directives = {
  ...config.global.directives,
  t: {
    mounted(el, binding) {
      el.textContent = `%${ binding.value }%`;
    },
    updated(el, binding) {
      el.textContent = `%${ binding.value }%`;
    }
  },
  'clean-tooltip':       cleanTooltipDirective,
  'clean-html':          cleanHtmlDirective,
  'stripped-aria-label': htmlStrippedAriaLabelDirective,
};

config.global.stubs['t'] = { template: '<span><slot /></span>' };

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

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => (key) => key }));
// eslint-disable-next-line no-console
jest.spyOn(console, 'warn').mockImplementation((warning) => warning.includes('[Vue warn]') ? null : console.log(warning));

/**
 * Common initialization for each test, required for resetting states
 */
beforeEach(() => {
  // jest.resetModules(); // Use this function inside your test if you need to remove any cache stored
  // jest.clearAllMocks(); // Use this function inside your test if you need to reset mocks
  jest.restoreAllMocks(); // Use this function inside your test if you need to reset mocks and restore existing functionality

  // Mock the $plugin object
  // config.mocks['$plugin'] = { getDynamic: () => undefined };

  config.global.mocks['$store'] = { getters: { 'i18n/t': jest.fn() } };
  // Overrides some components
  // config.stubs['my-component'] = { template: "<div></div> "};
});
