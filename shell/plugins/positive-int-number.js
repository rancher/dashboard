import { createApp } from 'vue';
const vueApp = createApp({});
import positiveIntNumberDirective from '@shell/directives/positive-int-number';

export default positiveIntNumberDirective;
/* eslint-disable-next-line no-console */
console.warn(`Importing positiveIntNumberDirective from plugins has been deprecated, use shell/directives/positive-int-number.js instead.
Make sure to invoke it using vueApp.directive('positiveIntNumber', positiveIntNumberDirective) to maintain compatibility.`);
vueApp.directive('positiveIntNumber', positiveIntNumberDirective);
