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

const intNumber = {
  install: (Vue) => {
    if (Vue.directive('intNumber')) {
      // eslint-disable-next-line no-console
      console.debug('Skipping intNumber install. Directive already exists.');
    } else {
      Vue.directive('int-number', { inserted });
    }
  }
};

export default intNumber;
/* eslint-disable-next-line no-console */
console.warn('The implicit addition of int-number has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(intNumber)` to maintain compatibility.');

Vue.use(intNumber);
