<script>
// Added by Verrazzano
import NetworkPolicyPeersTab from '@pkg/components/NetworkPoliciesTab/NetworkPolicyPeersTab';
import NetworkPolicyPortsTab from '@pkg/components/NetworkPoliciesTab/NetworkPolicyPortsTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'NetworkPolicyEgressRuleTab',
  components: {
    NetworkPolicyPeersTab,
    NetworkPolicyPortsTab,
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
      this.treeTabLabel = this.t('verrazzano.common.tabs.networkPolicyEgressRule');
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
      <NetworkPolicyPortsTab
        :value="getListField('ports')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'ports')"
        :tab-label="t('verrazzano.common.tabs.ports')"
        @input="setFieldIfNotEmpty('ports', $event)"
        @delete="setField('ports', undefined)"
      />
      <NetworkPolicyPeersTab
        :value="getListField('to')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'to')"
        :tab-label="t('verrazzano.common.tabs.to')"
        @input="setFieldIfNotEmpty('to', $event)"
        @delete="setField('to', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
