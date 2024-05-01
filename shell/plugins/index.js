/**
 * Load the directives
 *
 * These are included in a function that can be explictly called, so that we can be sure
 * of the execution order, rather than importing them at the top of a file.
 */
import cleanHtmlDirective from '@shell/plugins/clean-html-directive';
import VCleanTooltip from '@shell/plugins/clean-tooltip-directive';
import focus from '@shell/plugins/directives';
import trimWhitespace from '@shell/plugins/trim-whitespace';

export function loadDirectives(Vue) {
  Vue.use(cleanHtmlDirective);
  Vue.use(VCleanTooltip);
  Vue.use(focus);
  Vue.use(trimWhitespace);
}
