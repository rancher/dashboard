<script>
// Added by Verrazzano
import LifecycleHook from '@pkg/components/ContainersTab/ContainerLifecycleTab/LifecycleHook';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ContainerLifecycleTab',
  components: {
    LifecycleHook,
    TreeTab
  },
  mixins:     [VerrazzanoHelper],
  props:      {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    tabName: {
      type:    String,
      default: ''
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:  this.tabName || 'lifecycle',
      treeTabLabel: this.tabLabel,
    };
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.lifecycleHandlers');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #nestedTabs>
      <TreeTab :name="createTabName(treeTabName, 'postStart')" :label="t('verrazzano.common.tabs.lifecycleHandler.postStart')">
        <LifecycleHook
          :value="getField('postStart')"
          :mode="mode"
          @input="setFieldIfNotEmpty('postStart', $event)"
        />
      </TreeTab>
      <TreeTab :name="createTabName(treeTabName, 'preStop')" :label="t('verrazzano.common.tabs.lifecycleHandler.preStop')">
        <LifecycleHook
          :value="getField('preStop')"
          :mode="mode"
          @input="setFieldIfNotEmpty('preStop', $event)"
        />
      </TreeTab>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
