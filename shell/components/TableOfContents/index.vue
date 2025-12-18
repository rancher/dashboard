<script setup>
import { onMounted, getCurrentInstance } from 'vue';

const root = getCurrentInstance();

const isAccordionVNode = (vNode) => {
  // TODO nb better way of doing this that doesn't rely on a class
  return (vNode?.props?.class || '').includes('accordion-header');
};

/**
 * Pass through parent? Need tree
 *
 */

const findAccordionChildren = (accordions = [], node, parent) => {
  if (isAccordionVNode(node)) {
    accordions.push(node);
  }

  if (!node) {
    return;
  }

  const elChildren = node.el ? node?.el?.children ? Array.from(node?.el?.children) : [] : Array.from(node.children);

  elChildren.map((c) => {
    if (c.__vnode) {
      return findAccordionChildren(accordions, c.__vnode);
    }
  });

  return accordions;
};

const findAccordions = () => {
  const parent = root.parent || {};
  const accordions = findAccordionChildren([], parent.vnode);

  console.log('*** accordions found: ', accordions);
};

onMounted(() => {
  findAccordions();
});

</script>

<template>
  <div>
    <button
      class="btn btn-sm role-secondary"
      @click="findAccordions"
    >
      click me
    </button>
  </div>
</template>
