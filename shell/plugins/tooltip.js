/* eslint-disable no-console */
import Vue from 'vue';
import { VTooltip, VPopover, VClosePopover } from 'v-tooltip';

const vTooltip = {
  install: (Vue) => {
    Vue.directive('tooltip', VTooltip);
    Vue.directive('close-popover', VClosePopover);
    Vue.component('v-popover', VPopover);
  }
};

export default vTooltip;

console.warn('The implicit addition of v-tooltip has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(vTooltip)` to maintain compatibility.');

Vue.use(vTooltip);
