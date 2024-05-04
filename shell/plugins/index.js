/**
 * Load the directives
 *
 * These are included in a function that can be explictly called, so that we can be sure
 * of the execution order, rather than importing them at the top of a file.
 */
import focusDirective from '@shell/plugins/directives';
import cleanHtmlDirective from 'plugins/clean-html-directive';
import vCleanTooltip from 'plugins/clean-tooltip-directive';
import positiveIntNumber from '@shell/plugins/positive-int-number.js';
import trimWhitespace from '@shell/plugins/trim-whitespace';

export function loadDirectives(Vue) {
  Vue.directive('positiveIntNumber', { inserted: positiveIntNumber });
  Vue.directive('trim-whitespace', {
    inserted:         trimWhitespace,
    componentUpdated: trimWhitespace
  });
  Vue.directive('clean-html', cleanHtmlDirective);
  Vue.directive('clean-tooltip', vCleanTooltip);
  Vue.directive('focus', { inserted: focusDirective });
}
