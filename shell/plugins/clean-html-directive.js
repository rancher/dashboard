import Vue from 'vue';
import { purifyHTML } from './clean-html';

const cleanHtmlDirective = {
  inserted(el, binding) {
    el.innerHTML = purifyHTML(binding.value);
  },
  componentUpdated(el, binding) {
    el.innerHTML = purifyHTML(binding.value);
  },
  unbind(el) {
    el.innerHTML = '';
  }
};

export default cleanHtmlDirective;
// This is being done for backwards compatibility with our extensions that have written tests and didn't properly make use of Vue.use() when importing and mocking plugins

const isThisFileBeingExecutedInATest = process.env.NODE_ENV === 'test';

if (isThisFileBeingExecutedInATest) {
  /* eslint-disable-next-line no-console */
  console.warn('The implicit addition of clean-html has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.directive("clean-html", cleanHtmlDirective)` to maintain compatibility.');

  Vue.directive('clean-html', cleanHtmlDirective);
}
