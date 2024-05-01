/* eslint-disable no-console */
import Vue from 'vue';
import vSelect from 'vue-select';

const vueSelect = {
  install: (Vue) => {
    if (Vue.component('v-select')) {
      // eslint-disable-next-line no-console
      console.debug('Skipping v-select install. Component already exists.');
    } else {
      Vue.component('v-select', vSelect);
    }
  }
};

export default vueSelect;

console.warn('The implicit addition of vue-select has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(vueSelect)` to maintain compatibility.');

Vue.use(vueSelect);
