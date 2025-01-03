import { purifyHTML } from '@shell/plugins/clean-html';

const cleanHtmlDirective = {
  mounted(el, binding) {
    el.innerHTML = purifyHTML(binding.value);
  },
  updated(el, binding) {
    el.innerHTML = purifyHTML(binding.value);
  },
  unmounted(el) {
    el.innerHTML = '';
  }
};

export default cleanHtmlDirective;
