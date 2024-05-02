import Vue from 'vue';

export function trimWhitespace(el, dir) {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE ) {
      const trimmed = node.data.trim();

      if ( trimmed === '') {
        node.remove();
      } else if ( trimmed !== node.data ) {
        node.data = trimmed;
      }
    }
  }
}

const trimWhitespaceDirective = {
  install: (Vue) => {
    if (Vue.directive('trim-whitespace')) {
      // eslint-disable-next-line no-console
      console.debug('Skipping trim-whitespace install. Directive already exists.');
    } else {
      Vue.directive('trim-whitespace', {
        inserted:         trimWhitespace,
        componentUpdated: trimWhitespace
      });
    }
  }
};

export default trimWhitespaceDirective;
/* eslint-disable-next-line no-console */
console.warn('The implicit addition of trim-whitespace has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(trimWhitespaceDirective)` to maintain compatibility.');

Vue.use(trimWhitespaceDirective);
