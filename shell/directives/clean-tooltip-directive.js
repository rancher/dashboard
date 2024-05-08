import Vue from 'vue';
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

const vCleanTooltipDirective = {
  ...VTooltip,
  bind,
  update: bind,
};

export default vCleanTooltipDirective;

// This is being done for backwards compatibility with our extensions that have written tests and didn't properly make use of Vue.use() when importing and mocking plugins

const isThisFileBeingExecutedInATest = process.env.NODE_ENV === 'test';

if (isThisFileBeingExecutedInATest) {
  /* eslint-disable-next-line no-console */
  console.warn('The implicit addition of clean-tooltip has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.directive("clean-tooltip", vCleanTooltipDirective)` to maintain compatibility.');

  Vue.directive('clean-tooltip', vCleanTooltipDirective);
}
