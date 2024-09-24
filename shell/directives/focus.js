const getElement = (el, _binding, vnode) => {
  const component = vnode.component;

  if (!component) {
    return el;
  }

  const tag = component.type.__name;

  if (tag === 'LabeledInput') {
    return component.$refs.value;
  }

  if (tag === 'LabeledSelect') {
    component.shouldOpen = false;

    return component.$refs['select-input'].$refs.search;
  }

  if (tag === 'SelectPrincipal') {
    const labeledSelect = component.$refs['labeled-select'];

    labeledSelect.shouldOpen = false;

    return labeledSelect.$refs['select-input'].$refs.search;
  }

  if (tag === 'TextAreaAutoGrow') {
    return component.$refs.ta;
  }

  if (tag === 'Password') {
    return component.$refs.input.$refs.value;
  }
};

function mounted(el, binding, vnode) {
  const element = getElement(el, binding, vnode);

  if (element) {
    element.focus();
  }
}

const focusDirective = { mounted };

export default focusDirective;
