/**
 * Load the directives
 *
 * These are included in a function that can be explictly called, so that we can be sure
 * of the execution order, rather than importing them at the top of a file.
 */

import positiveIntNumber from '@shell/plugins/positive-int-number.js';
import trimWhitespace from '@shell/plugins/trim-whitespace';

export function loadDirectives(Vue) {
  import('./clean-html-directive');
  import('./clean-tooltip-directive');
  import('./directives');
  Vue.directive('positiveIntNumber', { inserted: positiveIntNumber });
  Vue.directive('trim-whitespace', {
    inserted:         trimWhitespace,
    componentUpdated: trimWhitespace
  });
}
