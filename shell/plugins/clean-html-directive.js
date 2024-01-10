import Vue from 'vue';
import { purifyHTML } from './clean-html';

export const cleanHtmlDirective = {
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

Vue.directive('clean-html', cleanHtmlDirective);
