import Vue from 'vue';
import { ResizeObserver } from 'vue-resize';
import 'vue-resize/dist/vue-resize.css';

const vueResize = {
  install: (Vue) => {
    if (Vue.component('resize-observer')) {
      // eslint-disable-next-line no-console
      console.debug('Skipping resize-observer install. Component already exists.');
    } else {
      Vue.component('resize-observer', ResizeObserver);
    }
  }
};

export default vueResize;
/* eslint-disable-next-line no-console */
console.warn('The implicit addition of vue-resize has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(vueResize)` to maintain compatibility.');

Vue.use(vueResize);
