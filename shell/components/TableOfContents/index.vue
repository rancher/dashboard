<script setup>
import debounce from 'lodash/debounce';
import { getCurrentInstance, ref, nextTick } from 'vue';

const root = getCurrentInstance();

const accordions = ref([]);

const isAccordionVNode = (vNode) => {
  const className = vNode?.el?.className || '';

  // // TODO nb better way of doing this that doesn't rely on a class
  // className could be an SVGAnimatedString object
  return typeof className === 'string' && className.includes('accordion-container');
};

// TODO nb refactor to more general 'find these components'
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

  // TODO nb refactor eyesore
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
  console.log('*** accordions found: ', accordions.value);
};

const openAccordion = (accNode) => {
  const componentContext = getComponentFromVNode(accNode)?.ctx;

  if (componentContext.isOpen) {
    return;
  }
  componentContext.toggle();
};

const scrollToAccordion = (accNode, parentAccNode) => {
  if (parentAccNode) {
    openAccordion(parentAccNode);
  }

  openAccordion(accNode);
  // use nextTick to make sure the accordion is open before scrolling it into view - needed for nested accordions in particular
  nextTick(() => {
    accNode.el.scrollIntoView(true);
  });
};

const getAccordionTitle = (vnode) => {
  const fallback = vnode?.el?.id;

  const componentContext = getComponentFromVNode(vnode)?.ctx;

  if (!componentContext || !componentContext.displayTitle) {
    return fallback;
  }

  return componentContext.displayTitle;
};

const getComponentFromVNode = (vnode) => {
  return vnode?.component ? vnode.component : vnode?.ctx?.vnode?.component;
};

// when the form initially loads all accordions will trigger this in rapid succession
const debouncedFindAccordions = debounce(findAccordions, 2);

defineExpose({ debouncedFindAccordions });

</script>

<template>
  <div>
    <div class="toc-container">
      <h4>
        {{ t('cruResource.tableOfContents.jumpTo') }}
      </h4>
      <ul>
        <li
          v-for="acc, i in accordions"
          :key="i"
        >
          <!-- TODO nb less repetitive with children? component? -->
          <a @click="scrollToAccordion(acc.node)"> {{ getAccordionTitle(acc?.node) }}</a>
          <template v-if="acc?.children?.length">
            <ul>
              <li
                v-for="childAcc, j in acc.children"
                :key="j"
              >
                <!-- TODO nb add aria attribute -->
                <a @click="scrollToAccordion(childAcc.node, acc.node)"> {{ getAccordionTitle(childAcc?.node) }}</a>
              </li>
            </ul>
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  li:not(:last-child) {
    margin-bottom: var(--gap);
  }

  h4 {
    margin-bottom: 12px;
    margin-top: 0px
  }

  li ul {
    padding-left: var(--gap-md);
    & li {
      margin-top: var(--gap);
      margin-bottom: 0px;
    }
  }

  .toc-container {
    position: sticky;
    top: 0;
    padding: var(--gap-md);
    // border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background-color: var(--subtle-overlay-bg ); //TODO nb confirm which var to use here
  }
</style>
