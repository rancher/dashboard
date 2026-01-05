<script setup>
import { randomStr } from 'utils/string';
import { onMounted, getCurrentInstance } from 'vue';

const root = getCurrentInstance();

const isAccordionVNode = (vNode) => {
  // TODO nb better way of doing this that doesn't rely on a class
  return (vNode?.el?.className || '').includes('accordion-container');
};

/**
 * Pass through parent? Need tree
 *
 */

const findAccordionChildren = (accordions = [], node) => {
  let nextInput = accordions;

  if (isAccordionVNode(node)) {
    const out = { self: node, children: [] };

    accordions.push(out);
    nextInput = out.children;
  }

  if (!node) {
    return;
  }

  const elChildren = node?.component?.subTree?.children || node?.el?.children ? Array.from(node?.el?.children) : [];

  elChildren.map((c) => {
    if (c.__vnode) {
      return findAccordionChildren(nextInput, c.__vnode );
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
