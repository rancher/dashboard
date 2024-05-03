import Vue from 'vue';

export default function trimWhitespace(el, dir) {
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

// This is being done for backwards compatibility with our extensions that have written tests and didn't properly make use of Vue.use() when importing and mocking translations

const isThisFileBeingExecutedInATest = process.env.NODE_ENV === 'test';

if (isThisFileBeingExecutedInATest) {
/* eslint-disable-next-line no-console */
  console.warn('The implicit addition of trim-whitespace has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke it using Vue.directive to maintain compatibility.');

  Vue.directive('trim-whitespace', {
    inserted:         trimWhitespace,
    componentUpdated: trimWhitespace
  });
}
