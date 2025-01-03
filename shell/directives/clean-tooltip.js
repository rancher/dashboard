import { VTooltip } from 'floating-vue';
import { purifyHTML } from '@shell/plugins/clean-html';

function purifyContent(value) {
  const type = typeof value;

  if (type === 'string') {
    return purifyHTML(value);
  } else if (value && type === 'object' && typeof value.content === 'string') {
    return { ...value, content: purifyHTML(value.content) };
  } else {
    return value;
  }
}

function beforeMount(el, { value, oldValue, modifiers }) {
  const purifiedValue = purifyContent(value);

  VTooltip.beforeMount(
    el,
    {
      value: purifiedValue, oldValue, modifiers
    });
}

const cleanTooltipDirective = {
  ...VTooltip,
  beforeMount,
  updated: beforeMount,
};

export default cleanTooltipDirective;
