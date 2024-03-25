import { createApp } from 'vue';
import { purifyHTML } from './clean-html';
const app = createApp({});

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

app.directive('clean-html', cleanHtmlDirective);
