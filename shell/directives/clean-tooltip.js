import { VTooltip } from 'v-tooltip';
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

function bind(el, { value, oldValue, modifiers }) {
  const purifiedValue = purifyContent(value);

  VTooltip.bind(
    el,
    {
      value: purifiedValue, oldValue, modifiers
    });
}

const cleanTooltipDirective = {
  ...VTooltip,
  bind,
  update: bind,
};

export default cleanTooltipDirective;
