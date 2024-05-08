import Vue from 'vue';

function inserted(el) {
  el.addEventListener('keypress', (e) => {
    e = e || window.event;
    const charcode = typeof e.charCode === 'number' ? e.charCode : e.keyCode;
    const inputChar = String.fromCharCode(charcode);

    // Allow digits, minus sign at the beginning, and Ctrl key combinations
    const re = /^-?\d*$/;

    if (!re.test(inputChar) && charcode > 9 && !e.ctrlKey) {
      if (e.preventDefault) {
        e.preventDefault();
      } else {
        e.returnValue = false;
      }
    }
  });
}
const intNumberDirective = { inserted };

export default intNumberDirective;

// This is being done for backwards compatibility with our extensions that have written tests and didn't properly make use of Vue.use() when importing and mocking plugins

const isThisFileBeingExecutedInATest = process.env.NODE_ENV === 'test';

if (isThisFileBeingExecutedInATest) {
  /* eslint-disable-next-line no-console */
  console.warn('The implicit addition of intNumber has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.directive("intNumber", intNumberDirective)` to maintain compatibility.');

  Vue.directive('intNumber', intNumberDirective);
}
