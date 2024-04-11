import { cleanHtmlDirective } from '@shell/plugins/clean-html-directive';
import { VCleanTooltip } from '@shell/plugins/clean-tooltip-directive';
import { focusDirective } from '@shell/plugins/directives';

/**
 * Load the directives
 *
 * These are included in a function that can be explictly called, so that we can be sure
 * of the execution order, rather than importing them at the top of a file.
 */
export function loadDirectives(Vue) {
  Vue.directive('clean-html', cleanHtmlDirective);
  Vue.directive('clean-tooltip', VCleanTooltip);
  Vue.directive('focus', focusDirective);
}
