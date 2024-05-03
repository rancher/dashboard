import Vue from 'vue';

function positiveIntNumber(el) {
  el.addEventListener('keypress', (e) => {
    e = e || window.event;
    const charcode = typeof e.charCode === 'number' ? e.charCode : e.keyCode;
    const re = /^\d+$/; // Use regex to match positive numbers

    if (!re.test(String.fromCharCode(charcode)) && charcode > 9 && !e.ctrlKey) {
      if (e.preventDefault) {
        e.preventDefault();
      } else {
        e.returnValue = false;
      }
    }
  });
}

export default positiveIntNumber;
/* eslint-disable-next-line no-console */
console.warn('The implicit addition of positiveIntNumber has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(positiveIntNumber)` to maintain compatibility.');

Vue.directive('positiveIntNumber', { inserted: positiveIntNumber });
