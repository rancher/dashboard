import Vue from 'vue';
import ShortKey from 'vue-shortkey';

const vShortKey = {
  install: (Vue) => {
    if (Vue.component('shortkey')) {
      // eslint-disable-next-line no-console
      console.debug('Skipping shortkey install. Component already exists.');
    } else {
      Vue.directive('shortkey', { ...ShortKey, prevent: ['input', 'textarea', 'select'] });
    }
  }
};

export default vShortKey;
/* eslint-disable-next-line no-console */
console.warn('The implicit addition of shortkey has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(vShortKey)` to maintain compatibility.');

Vue.use(vShortKey);
