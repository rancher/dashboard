import { config } from '@vue/test-utils';
import { directiveSsr as t } from '@shell/plugins/i18n';
import VTooltip from 'v-tooltip';
import VModal from 'vue-js-modal';
import vSelect from 'vue-select';

import Vue from 'vue';

Vue.config.productionTip = false;
Vue.use(VTooltip).use(VModal);
Vue.component('v-select', vSelect);

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
  jest.restoreAllMocks(); // Use this function inside your test if you need to reset mocks and restore existing functionality

  config.mocks['$store'] = { getters: { 'i18n/t': jest.fn() } };
  config.directives = { t };

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
