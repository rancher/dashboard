import { createApp } from 'vue';
import intNumberDirective from '@shell/directives/int-number';
const vueApp = createApp({});

export default intNumberDirective;
/* eslint-disable-next-line no-console */
console.warn(`Importing intNumberDirective from plugins has been deprecated, use shell/directives/int-number.js instead.
Make sure to invoke it using vueApp.directive('intNumber', intNumberDirective) to maintain compatibility.`);
vueApp.directive('intNumber', intNumberDirective);
