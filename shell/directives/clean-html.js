import { purifyHTML } from '@shell/plugins/clean-html';

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
