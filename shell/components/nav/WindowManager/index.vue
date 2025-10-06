<script setup lang="ts">
import { BOTTOM, LEFT, RIGHT } from '@shell/utils/position';
import HorizontalPanel from './panels/HorizontalPanel.vue';
import VerticalPanel from './panels/VerticalPanel.vue';
import PinArea from './PinArea.vue';
import useComponentsMount from './composables/useComponentsMount';
import useTabsHandler from './composables/useTabsHandler';
import usePanelsHandler from '@shell/components/nav/WindowManager/composables/usePanelsHandler';
import { Layout, Position } from '@shell/types/window-manager';

const props = defineProps({
  layout: {
    type:    String as () => Layout,
    default: Layout.default,
  },
  positions: {
    type:    Array as () => Position[],
    default: () => [BOTTOM, LEFT, RIGHT]
  },
});

const { loadComponent } = useComponentsMount();

const { isPanelEnabled } = usePanelsHandler({ layout: props.layout, positions: props.positions });
const { tabs } = useTabsHandler();
</script>

<template>
  <HorizontalPanel
    v-if="isPanelEnabled[BOTTOM]"
    :position="BOTTOM"
  />
  <VerticalPanel
    v-if="isPanelEnabled[LEFT]"
    :position="LEFT"
  />
  <VerticalPanel
    v-if="isPanelEnabled[RIGHT]"
    :position="RIGHT"
  />
  <Teleport
    v-for="{ tab, containerId } in tabs"
    :key="tab.id"
    :to="`#${ containerId }`"
  >
    <keep-alive>
      <component
        :is="loadComponent(tab)"
        :key="tab.id"
        :tab="tab"
        :active="true"
        :height="tab.containerHeight"
        :width="tab.containerWidth"
        v-bind="tab.attrs"
      />
    </keep-alive>
  </Teleport>
  <PinArea />
</template>
