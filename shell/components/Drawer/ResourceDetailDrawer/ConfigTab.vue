<script setup lang="ts">
import { useI18n } from '@shell/composables/useI18n';
import { _VIEW } from '@shell/config/query-params';
import { useStore } from 'vuex';
import Tab from '@shell/components/Tabbed/Tab.vue';
import DrawerCard from '@shell/components/Drawer/DrawerCard.vue';
import { ConfigProps } from '@shell/components/Drawer/ResourceDetailDrawer/types';

const props = defineProps<ConfigProps>();
const store = useStore();
const i18n = useI18n(store);
</script>
<template>
  <Tab
    class="config-tab"
    name="config-tab"
    :label="i18n.t('component.drawer.resourceDetailDrawer.configTab.title')"
  >
    <DrawerCard>
      <component
        :is="props.component"
        :value="props.resource"
        :liveValue="props.resource"
        :resourceType="props.resourceType"
        :mode="_VIEW"
        :real-mode="_VIEW"
        :initial-value="props.resource"
        :use-tabbed-hash="false /* Have to disable hashing on child components or it modifies the url and closes the drawer */"
        :default-tab="props.defaultTab"
        as="config"
      />
    </DrawerCard>
  </Tab>
</template>

<style lang="scss" scoped>
.config-tab {
  // Handle the loading indicator
  :deep() .overlay-content-mode {
    left: 0;
    top: 0;
  }

  :deep() .cru-resource-footer {
    display: none;
  }
}
</style>
