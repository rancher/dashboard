<script setup lang="ts">
import { useI18n } from '@shell/composables/useI18n';
import { _VIEW } from '@shell/config/query-params';
import { useStore } from 'vuex';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useTemplateRef } from 'vue';
import ResourceYaml from '@shell/components/ResourceYaml.vue';
import { YamlProps } from '@shell/components/Drawer/ResourceDetailDrawer/types';

const props = defineProps<YamlProps>();
const store = useStore();
const i18n = useI18n(store);
const yamlComponent: any = useTemplateRef('yaml');
</script>
<template>
  <Tab
    class="yaml-tab"
    name="yaml-tab"
    :label="i18n.t('component.drawer.resourceDetailDrawer.yamlTab.title')"
    @active="() => yamlComponent?.refresh()"
  >
    <ResourceYaml
      ref="yaml"
      :value="props.resource"
      :yaml="props.yaml"
      :mode="_VIEW"
    />
  </Tab>
</template>

<style lang="scss" scoped>
.yaml-tab {
  :deep() .codemirror-container {
    background-color: var(--body-bg);
    border-radius: var(--border-radius-md);
    padding: 16px;

    .CodeMirror, .CodeMirror-gutter {
      background-color: var(--body-bg);
    }
  }
}
</style>
