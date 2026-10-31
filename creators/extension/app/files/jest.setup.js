/**
 * Global Jest setup for a Rancher UI extension.
 *
 * Registers the pieces of the dashboard runtime that shell components expect to be present
 * (the shell models, i18n, tooltips, `v-select`, the shell directives) so components can be mounted in isolation,
 * and polyfills the browser APIs that jsdom does not implement.
 */
import { config } from '@vue/test-utils';
import { TextEncoder, TextDecoder } from 'util';
import FloatingVue from 'floating-vue';
import vSelect from 'vue-select';
import { floatingVueOptions } from '@shell/plugins/floating-vue';
import cleanHtmlDirective from '@shell/directives/clean-html';
import cleanTooltipDirective from '@shell/directives/clean-tooltip';
import htmlStrippedAriaLabelDirective from '@shell/directives/strip-html-aria-label';
import '@shell/plugins/replaceall';
import { installModels } from '@shell/initialize/install-models';

installModels();

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

config.global.components['v-select'] = vSelect;
config.global.plugins = [[FloatingVue, floatingVueOptions]];

config.global.directives = {
  ...config.global.directives,
  // Stand-in for shell's `v-t` translation directive: renders `%some.key%` so assertions can
  // match on the key rather than on translated copy.
  t: {
    mounted(el, binding) {
      el.textContent = `%${ binding.value }%`;
    },
    updated(el, binding) {
      el.textContent = `%${ binding.value }%`;
    }
  },
  'clean-html':          cleanHtmlDirective,
  'clean-tooltip':       cleanTooltipDirective,
  'stripped-aria-label': htmlStrippedAriaLabelDirective,
};

config.global.stubs['t'] = { template: '<span><slot /></span>' };

// `useI18n` reaches into the store-backed i18n plugin, which is not booted in unit tests.
jest.mock('@shell/composables/useI18n', () => {
  return { useI18n: () => ({ t: (key, options) => `${ key }${ options ? `-${ JSON.stringify(options) }` : '' }` }) };
});

beforeAll(() => {
  // matchMedia, getContext and IntersectionObserver are not implemented by jsdom.
  // https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value:    jest.fn().mockImplementation(() => ({
      matches:             false,
      addListener:         jest.fn(),
      removeListener:      jest.fn(),
      addEventListener:    jest.fn(),
      removeEventListener: jest.fn()
    }))
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    writable: true,
    value:    jest.fn().mockImplementation(() => ({
      createLinearGradient: jest.fn(),
      fillRect:             jest.fn(),
      getImageData:         jest.fn(() => ({ data: [] }))
    }))
  });
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value:    jest.fn().mockImplementation(() => ({
      observe:    jest.fn(),
      unobserve:  jest.fn(),
      disconnect: jest.fn(),
    })),
  });
});

beforeEach(() => {
  jest.restoreAllMocks();

  // A minimal Vuex store covering the getters almost every shell component reads. Anything
  // resource-specific (`management/schemaFor`, `cluster/*`, `type-map/*`, ...) is deliberately
  // left out - pass your own `global.mocks.$store` from the test that needs it.
  config.global.mocks['$store'] = {
    getters: {
      'i18n/t':            (key) => `%${ key }%`,
      'i18n/exists':       () => true,
      'i18n/withFallback': (key, args, fallback) => fallback ?? `%${ key }%`,
      'prefs/get':         () => undefined,
    },
    dispatch: jest.fn(),
    commit:   jest.fn(),
  };
  config.global.mocks['t'] = (key) => `%${ key }%`;
});
