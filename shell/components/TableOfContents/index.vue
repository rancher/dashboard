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

const findAccordionChildren = (accordions = { }, node) => {
  let nextInput = accordions;

  if (isAccordionVNode(node)) {
    const id = node?.el?.id || randomStr();

    // accordions.push(node);
    accordions[id] = { self: node, children: {} };
    nextInput = accordions[id].children;
  }

  if (!node) {
    return;
  }

  const elChildren = node.el ? node?.el?.children ? Array.from(node?.el?.children) : [] : Array.from(node.children);

  elChildren.map((c) => {
    if (c.__vnode) {
      return findAccordionChildren(nextInput, c.__vnode );
    }
  });

  return accordions;
};

const findAccordions = () => {
  const parent = root.parent || {};
  const accordions = findAccordionChildren({ }, parent.vnode);

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
