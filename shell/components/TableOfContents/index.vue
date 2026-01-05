<script setup>
import { randomStr } from 'utils/string';
import { onMounted, getCurrentInstance, ref } from 'vue';

const root = getCurrentInstance();

const accordions = ref([]);

const isAccordionVNode = (vNode) => {
  // TODO nb better way of doing this that doesn't rely on a class
  return (vNode?.el?.className || '').includes('accordion-container');
};

const findAccordionChildren = (accordions = [], node) => {
  let nextInput = accordions;

  if (isAccordionVNode(node)) {
    const out = { node, children: [] };

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

  accordions.value = findAccordionChildren([], parent.vnode);
};

const scrollToAccordion = (accNode) => {
  if (!accNode.el) {
    return;
  }
  accNode.el.scrollIntoView(true);
};

// TODO nb need to run this after all other components have loaded, somehow
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
  <div class="toc-container">
    <ul>
      <li
        v-for="acc, i in accordions"
        :key="i"
        @click="scrollToAccordion(acc.node)"
      >
        {{ acc?.node?.el?.id }}
        <template v-if="acc?.children?.length">
          <ul>
            <li
              v-for="childAcc, j in acc.children"
              :key="j"
              @click="scrollToAccordion(acc.node)"
            >
              {{ childAcc?.node?.el?.id }}
            </li>
          </ul>
        </template>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
  .toc-container {
  }
</style>
