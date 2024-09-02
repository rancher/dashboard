import Vue from 'vue';
import cleanHtmlDirective from '@shell/directives/clean-html';

export default cleanHtmlDirective;

/* eslint-disable-next-line no-console */
console.warn(`Importing cleanHtmlDirective from plugins has been deprecated, use shell/directives/clean-html.js instead.  
Make sure to invoke Vue.directive('clean-html', cleanHtmlDirective) to maintain compatibility.`);
Vue.directive('clean-html', cleanHtmlDirective);
