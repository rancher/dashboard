import Vue from 'vue';

const getElement = (vnode) => {
  const { componentInstance, componentOptions: { tag } } = vnode;

  if (tag === 'LabeledInput') {
    return componentInstance.$refs.value;
  }

  if (tag === 'LabeledSelect') {
    componentInstance.shouldOpen = false;

    return componentInstance.$refs['select-input'].$refs.search;
  }

  if (tag === 'SelectPrincipal') {
    const labeledSelect = componentInstance.$refs['labeled-select'];

    labeledSelect.shouldOpen = false;

    return labeledSelect.$refs['select-input'].$refs.search;
  }

  if (tag === 'TextAreaAutoGrow') {
    return componentInstance.$refs.ta;
  }

  if (tag === 'Password') {
    return componentInstance.$refs.input.$refs.value;
  }
};

function focusDirective(_el, _binding, vnode) {
  const element = getElement(vnode);

  if (element) {
    element.focus();
  }
}

Vue.directive('focus', { inserted: focusDirective });

export default focusDirective;

/* eslint-disable-next-line no-console */
console.warn('The implicit addition of focus has been deprecated in Rancher Shell and will be removed in a future version. Make sure to invoke `Vue.directive("focus", { inserted: focusDirective });` to maintain compatibility.');
