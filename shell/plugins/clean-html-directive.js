import Vue from 'vue';
import { purifyHTML } from './clean-html';

const cleanHtmlDir = {
  inserted(el, binding) {
    el.innerHTML = purifyHTML(binding.value);
  },
  componentUpdated(el, binding) {
    el.innerHTML = purifyHTML(binding.value);
  },
  unbind(el) {
    el.innerHTML = '';
  }
};

const cleanHtmlDirective = {
  install: (Vue) => {
    if (Vue.directive('clean-html')) {
      // eslint-disable-next-line no-console
      console.debug('Skipping clean-html install. Directive already exists.');
    } else {
      Vue.directive('clean-html', cleanHtmlDir);
    }
  }
};

export default cleanHtmlDirective;
/* eslint-disable-next-line no-console */
console.warn('The implicit addition of clean-html has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(cleanHtmlDirective)` to maintain compatibility.');

Vue.use(cleanHtmlDirective);
