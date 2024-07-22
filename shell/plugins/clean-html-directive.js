import { createApp } from 'vue';
const vueApp = createApp({});
import cleanHtmlDirective from '@shell/directives/clean-html';

export default cleanHtmlDirective;

/* eslint-disable-next-line no-console */
console.warn(`Importing cleanHtmlDirective from plugins has been deprecated, use shell/directives/clean-html.js instead.  
Make sure to invoke vueApp.directive('clean-html', cleanHtmlDirective) to maintain compatibility.`);
vueApp.directive('clean-html', cleanHtmlDirective);
