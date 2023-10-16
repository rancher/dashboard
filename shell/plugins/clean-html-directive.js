import Vue from 'vue';
import DOMPurify from 'dompurify';
import { uniq } from '@shell/utils/array';

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

// Allow 'A' tags to keep the target=_blank attribute if they have it
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (node.tagName === 'A' && data.attrName === 'target' && data.attrValue === '_blank') {
    data.forceKeepAttr = true;
  }
});

// Ensure if an 'A' tag has target=_blank that we add noopener, noreferrer and nofollow to the 'rel' attribute
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node?.target === '_blank') {
    const rel = ['noopener', 'noreferrer', 'nofollow'];
    const existingRel = node.rel?.length ? node.rel.split(' ') : [];
    const combined = uniq([...rel, ...existingRel]);

    node.setAttribute('rel', combined.join(' '));
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
