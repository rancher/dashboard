/**
 * Load the directives
 *
 * These are included in a function that can be explictly called, so that we can be sure
 * of the execution order, rather than importing them at the top of a file.
 */
import focusDirective from 'directives/focus';
import cleanHtmlDirective from 'directives/clean-html';
import cleanTooltipDirective from 'directives/clean-tooltip';
import positiveIntNumberDirective from 'directives/positive-int-number.js';
import trimWhitespaceDirective from 'directives/trim-whitespace';
import intNumberDirective from 'directives/int-number';

export function loadDirectives(Vue) {
  Vue.directive('trim-whitespace', trimWhitespaceDirective);
  Vue.directive('clean-html', cleanHtmlDirective);
  Vue.directive('clean-tooltip', cleanTooltipDirective);
  Vue.directive('focus', focusDirective);
  Vue.directive('intNumber', intNumberDirective);
  Vue.directive('positiveIntNumber', positiveIntNumberDirective);
}
