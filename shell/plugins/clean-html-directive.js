import Vue from 'vue';
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'code',
  'li',
  'a',
  'p',
  'b',
  'br',
  'ul',
  'pre',
  'span',
  'div',
  'i',
  'em',
  'strong',
];

export const purifyHTML = (value) => DOMPurify.sanitize(value, { ALLOWED_TAGS });

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
