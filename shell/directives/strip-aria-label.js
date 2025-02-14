export default {
  mounted(el, binding) {
    if (typeof binding.value === 'string') {
      const htmlStrippedAriaLabelString = binding.value.replace(/<\/?[^>]+(>|$)/g, '');

      el.setAttribute('aria-label', htmlStrippedAriaLabelString);
    }
  },
  updated(el, binding) {
    if (typeof binding.value === 'string') {
      const htmlStrippedAriaLabelString = binding.value.replace(/<\/?[^>]+(>|$)/g, '');

      el.setAttribute('aria-label', htmlStrippedAriaLabelString);
    }
  }
};
