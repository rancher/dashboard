import Vue from 'vue';
import { VTooltip } from 'v-tooltip';
import { purifyHTML } from './clean-html';

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

export const VCleanTooltipDir = {
  ...VTooltip,
  bind,
  update: bind,
};

const VCleanTooltip = {
  install: (Vue) => {
    if (Vue.directive('clean-tooltip')) {
      // eslint-disable-next-line no-console
      console.debug('Skipping clean-tooltip install. Directive already exists.');
    } else {
      Vue.directive('clean-tooltip', VCleanTooltipDir);
    }
  }

};

export default VCleanTooltip;
/* eslint-disable-next-line no-console */
console.warn('The implicit addition of clean-tooltip has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.use(VCleanTooltip)` to maintain compatibility.');

Vue.use(VCleanTooltip);
