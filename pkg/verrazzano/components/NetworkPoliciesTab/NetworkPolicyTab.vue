<script>
// Added by Verrazzano
import NetworkPolicySpecTab from '@pkg/components/NetworkPoliciesTab/NetworkPolicySpecTab';
import ObjectMetadataTab from '@pkg/components/ObjectMetadataTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'NetworkPolicyTab',
  components: {
    NetworkPolicySpecTab,
    ObjectMetadataTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.networkPolicy');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #nestedTabs>
      <ObjectMetadataTab
        :value="getField('metadata')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'metadata')"
        @input="setFieldIfNotEmpty('metadata', $event)"
        @delete="setField('metadata', undefined)"
      />
      <NetworkPolicySpecTab
        :value="getField('spec')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'spec')"
        @input="setFieldIfNotEmpty('spec', $event)"
        @delete="setField('spec', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
