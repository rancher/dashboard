import Vue from 'vue';
import trimWhitespaceDirective from '@shell/directives/trim-whitespace';

export default trimWhitespaceDirective;
/* eslint-disable-next-line no-console */
console.warn(`Importing trimWhitespaceDirective from plugins has been deprecated, use shell/directives/trim-whitespace.js instead.
Make sure to invoke it using Vue.directive('trim-whitespace', trimWhitespaceDirective ) to maintain compatibility.`);

Vue.directive('trim-whitespace', trimWhitespaceDirective );
