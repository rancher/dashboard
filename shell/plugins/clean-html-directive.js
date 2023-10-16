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

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // set all elements owning target to target=_blank if rel property includes the correct values, making it safe
  // Solution based on https://github.com/cure53/DOMPurify/issues/317
  if ('rel' in node && node.rel.includes('noopener') && node.rel.includes('noreferrer') && node.rel.includes('nofollow')) {
    node.setAttribute('target', '_blank');
  }
});

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
