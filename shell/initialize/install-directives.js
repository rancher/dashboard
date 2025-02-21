/**
 * Load the directives
 *
 * These are included in a function that can be explictly called, so that we can be sure
 * of the execution order, rather than importing them at the top of a file.
 */
import focusDirective from '@shell/directives/focus';
import cleanHtmlDirective from '@shell/directives/clean-html';
import cleanTooltipDirective from '@shell/directives/clean-tooltip';
import positiveIntNumberDirective from '@shell/directives/positive-int-number.js';
import trimWhitespaceDirective from '@shell/directives/trim-whitespace';
import intNumberDirective from '@shell/directives/int-number';
import htmlStrippedAriaLabelDirective from '@shell/directives/strip-html-aria-label';

/**
 * Prevent extensions from overriding existing directives
 * Hook into vueApp.directive and keep track of the directive names that have been added
 * and prevent an existing directive from being overwritten
 * @param {*} vueApp Vue instance
 */
const storeDirectives = (vueApp) => {
  const directiveNames = {};
  const vueDirective = vueApp.directive;

  vueApp.directive = function(name) {
    if (directiveNames[name]) {
      console.log(`Can not override directive: ${ name }`); // eslint-disable-line no-console

      return;
    }

    directiveNames[name] = true;

    vueDirective.apply(vueApp, arguments);
  };
};

/**
 * Load the directives from the plugins - we do this with a function so we know
 * these are initialized here, after the code above which keeps track of them and
 * prevents over-writes
 * @param {*} vueApp Vue instance
 */
function addDirectives(vueApp) {
  vueApp.directive('trim-whitespace', trimWhitespaceDirective);
  vueApp.directive('clean-html', cleanHtmlDirective);
  vueApp.directive('clean-tooltip', cleanTooltipDirective);
  vueApp.directive('focus', focusDirective);
  vueApp.directive('intNumber', intNumberDirective);
  vueApp.directive('positiveIntNumber', positiveIntNumberDirective);
  vueApp.directive('stripped-aria-label', htmlStrippedAriaLabelDirective);
}

/**
 * Install directives in bulks. It will store existing ones
 * @param {*} vueApp Vue instance
 */
export const installDirectives = (vueApp) => {
  storeDirectives(vueApp);
  addDirectives(vueApp);
};
