<script setup>
import { onMounted, getCurrentInstance } from 'vue';

const root = getCurrentInstance();

const isAccordionVNode = (vNode) => {
  return vNode?.component?.type?.name === 'Accordion';
};

const findAccordionChildren = (node) => {
  const out = [];

  console.log('*** finding children in ', node);
  if (isAccordionVNode(node)) {
    return node;
  }

  if (!node) {
    return;
  }
  const subTreeChildren = node?.component?.subTree;
  const children = node.children;

  console.log('*** parent children, subTreechildren: ', children, subTreeChildren);

  if (node.component) {
    const accordions = findAccordionChildren(subTreeChildren);

    if (accordions && accordions.length) {
      out.push(...accordions);
    }
    console.log('*** accordions : ', accordions);
  }
  //   if (children && Array.isArray(children)) {
  //     const accordionsChildren = children.map((c) => findAccordionChildren(c)).filter((c) => !!c && c.length);

  //     console.log('** accordions children ', accordionsChildren);
  //     out.push(...accordionsChildren);
  //   }
  const elVNodeChildren = node?.el?.__vnode?.children;

  console.log('elVNodeChildren ', elVNodeChildren);

  const elChildren = node?.el?.children;

  console.log('elChildren ', elChildren);

  if (elChildren && Array.isArray(elChildren)) {
    const elChildrenAccordions = elChildren.map((c) => findAccordionChildren(c)).filter((c) => !!c && c.length);

    console.log('** elChildrenAccordions ', elChildrenAccordions);
    out.push(...elChildrenAccordions);
  }
  if (elVNodeChildren && Array.isArray(elVNodeChildren)) {
    const elChildrenAccordions = elVNodeChildren.map((c) => findAccordionChildren(c)).filter((c) => !!c && c.length);

    console.log('** elNodeChildrenAccordions ', elChildrenAccordions);
    out.push(...elChildrenAccordions);
  } else if (children && Array.isArray(children)) {
    const accordionsChildren = children.map((c) => findAccordionChildren(c)).filter((c) => !!c && c.length);

    console.log('** accordions children ', accordionsChildren);
    out.push(...accordionsChildren);
  }

  return out;
};

const findAccordions = () => {
  const parent = root.parent || {};
  const accordions = findAccordionChildren(parent.vnode);

  console.log('*** accordions found: ', accordions);
};

onMounted(() => {
  console.log('*** onounted running');
  findAccordions();
});

</script>

<template><div>wow_its_fucking_nothing.jpeg</div></template>
