<script lang="ts">
import Drawer from '@shell/components/Drawer/Chrome.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import Tabbed from '@shell/components/Tabbed/index.vue';
import YamlTab, { Props as YamlProps } from '@shell/components/Drawer/ResourceDetailDrawer/YamlTab.vue';
import { useDefaultConfigTabProps, useDefaultYamlTabProps } from '@shell/components/Drawer/ResourceDetailDrawer/composables';
import ConfigTab from '@shell/components/Drawer/ResourceDetailDrawer/ConfigTab.vue';
import { computed, ref } from 'vue';
import RcButton from '@components/RcButton/RcButton.vue';
import StateDot from '@shell/components/StateDot/index.vue';

export interface Props {
  resource: any;

  onClose?: () => void;
}
</script>
<script setup lang="ts">
const editBttnDataTestId = 'save-configuration-bttn';
const componentTestid = 'configuration-drawer-tabbed';
const props = defineProps<Props>();
const emit = defineEmits(['close']);
const store = useStore();
const i18n = useI18n(store);

const yamlTabProps = ref<YamlProps | null>(null);
const configTabProps = useDefaultConfigTabProps(props.resource);

useDefaultYamlTabProps(props.resource).then((props) => {
  yamlTabProps.value = props;
});

const title = computed(() => {
  const resourceType = store.getters['type-map/labelFor']({ id: props.resource.type });
  const resourceName = props.resource.nameDisplay;

  return i18n.t('component.drawer.resourceDetailDrawer.title', { resourceType, resourceName });
});

const activeTab = ref<string>(configTabProps ? 'config-tab' : 'yaml-tab');

const isConfig = computed(() => {
  return activeTab.value === 'config-tab';
});

const action = computed(() => {
  const ariaLabel = isConfig.value ? i18n.t('component.drawer.resourceDetailDrawer.ariaLabel.editConfig') : i18n.t('component.drawer.resourceDetailDrawer.ariaLabel.editYaml');
  const label = isConfig.value ? i18n.t('component.drawer.resourceDetailDrawer.ariaLabel.editConfig') : i18n.t('component.drawer.resourceDetailDrawer.ariaLabel.editYaml');
  const action = isConfig.value ? () => props.resource.goToEdit() : () => props.resource.goToEditYaml();

  return {
    ariaLabel,
    label,
    action
  };
});

const canEdit = computed(() => {
  return isConfig.value ? props.resource.canEdit : props.resource.canEditYaml;
});

</script>
<template>
  <Drawer
    class="resource-detail-drawer"
    :ariaTarget="title"
    @close="emit('close')"
  >
    <template #title>
      <StateDot
        :color="resource.stateSimpleColor"
        class="mmr-3"
      />
      {{ title }}
    </template>
    <template #body>
      <Tabbed
        class="tabbed"
        :useHash="false"
        :showExtensionTabs="false"
        :componentTestid="componentTestid"
        @changed="({selectedName}) => {activeTab = selectedName;}"
      >
        <ConfigTab
          v-if="configTabProps"
          v-bind="configTabProps"
        />
        <YamlTab
          v-if="yamlTabProps"
          v-bind="yamlTabProps"
        />
      </Tabbed>
    </template>
    <template #additional-actions>
      <RcButton
        v-if="canEdit"
        :primary="true"
        :aria-label="action.ariaLabel"
        :data-testid="editBttnDataTestId"
        @click="action.action"
      >
        {{ action.label }}
      </RcButton>
    </template>
  </Drawer>
</template>

<style lang="scss" scoped>
.resource-detail-drawer {
  :deep() .tabbed {
    & > .tabs {
      border: none;
    }

    & > .tab-container {
      border: none;
      border-top: 1px solid var(--border);
      padding: 0;
      padding-top: 24px;
    }
  }
}
</style>
