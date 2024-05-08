/**
 * Load the directives
 *
 * These are included in a function that can be explictly called, so that we can be sure
 * of the execution order, rather than importing them at the top of a file.
 */
import focusDirective from 'plugins/focus';
import cleanHtmlDirective from 'plugins/clean-html-directive';
import vCleanTooltip from 'plugins/clean-tooltip-directive';
import positiveIntNumberDirective from '@shell/plugins/positive-int-number.js';
import trimWhitespace from '@shell/plugins/trim-whitespace';
import intNumberDirective from 'plugins/int-number';

export function loadDirectives(Vue) {
  Vue.directive('trim-whitespace', {
    inserted:         trimWhitespace,
    componentUpdated: trimWhitespace
  });
  Vue.directive('clean-html', cleanHtmlDirective);
  Vue.directive('clean-tooltip', vCleanTooltip);
  Vue.directive('focus', focusDirective);
  Vue.directive('intNumber', intNumberDirective);
  Vue.directive('positiveIntNumber', positiveIntNumberDirective);
}
