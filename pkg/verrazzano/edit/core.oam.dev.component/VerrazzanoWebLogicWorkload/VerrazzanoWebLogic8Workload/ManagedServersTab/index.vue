<script>
// Added by Verrazzano
import AddNamedElement from '@pkg/components/AddNamedElement';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import ManagedServerTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/VerrazzanoWebLogic8Workload/ManagedServersTab/ManagedServerTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'ManagedServersTab',
  components: {
    AddNamedElement,
    ManagedServerTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [WebLogicWorkloadHelper, DynamicListHelper],
  props:  {
    value: {
      type:    Array,
      default: () => ([])
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
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
  methods: {
    getDynamicListTabName(child) {
      return this.createTabName(this.tabName, child?.serverName);
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.managedServers');
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
        @click="dynamicListClearChildrenList"
      />
    </template>
    <template #default>
      <AddNamedElement
        :value="dynamicListChildren"
        :add-type="t('verrazzano.weblogic.tabs.managedServer')"
        key-field-name="serverName"
        :mode="mode"
        @input="dynamicListAddChild({ serverName: $event })"
      />
    </template>
    <template #nestedTabs>
      <ManagedServerTab
        v-for="(server, idx) in dynamicListChildren"
        :key="server._id"
        :value="server"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, server.serverName)"
        @input="dynamicListUpdate"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>
