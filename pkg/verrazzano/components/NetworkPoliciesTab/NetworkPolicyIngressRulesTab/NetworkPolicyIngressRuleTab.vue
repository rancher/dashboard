<script>
// Added by Verrazzano
import NetworkPolicyPeersTab from '@pkg/components/NetworkPoliciesTab/NetworkPolicyPeersTab';
import NetworkPolicyPortsTab from '@pkg/components/NetworkPoliciesTab/NetworkPolicyPortsTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'NetworkPolicyIngressRuleTab',
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
      this.treeTabLabel = this.t('verrazzano.common.tabs.networkPolicyIngressRule');
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
      <NetworkPolicyPeersTab
        :value="getListField('from')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'from')"
        :tab-label="t('verrazzano.common.tabs.from')"
        @input="setFieldIfNotEmpty('from', $event)"
        @delete="setField('from', undefined)"
      />
      <NetworkPolicyPortsTab
        :value="getListField('ports')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'ports')"
        :tab-label="t('verrazzano.common.tabs.ports')"
        @input="setFieldIfNotEmpty('ports', $event)"
        @delete="setField('ports', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
