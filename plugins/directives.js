import Vue from 'vue';

Vue.directive('focus', {
  inserted(_el, _binding, vnode) {
    const element = getElement(vnode);

    if (element) {
      element.focus();
    }
  }
});

const getElement = (vnode) => {
  switch (vnode.componentOptions.tag) {
  case 'LabeledInput':
    return vnode.componentInstance.$refs.value;

  case 'LabeledSelect':
    return vnode.componentInstance.$refs['select-input'].$refs.search;
  }
};
