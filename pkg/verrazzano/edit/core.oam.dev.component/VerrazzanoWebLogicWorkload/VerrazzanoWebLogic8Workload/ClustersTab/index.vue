<script>
// Added by Verrazzano
import AddNamedElement from '@pkg/components/AddNamedElement';
import ClusterTab from '@pkg/edit/core.oam.dev.component/VerrazzanoWebLogicWorkload/VerrazzanoWebLogic8Workload/ClustersTab/ClusterTab';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WebLogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'ClustersTab',
  components: {
    AddNamedElement,
    ClusterTab,
    TabDeleteButton,
    TreeTab
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
      return this.createTabName(this.treeTabName, child?.clusterName);
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.weblogic.tabs.clusters');
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
        :mode="mode"
        key-field-name="clusterName"
        :add-type="t('verrazzano.weblogic.tabs.cluster')"
        @input="dynamicListAddChild({ clusterName: $event })"
      />
    </template>
    <template #nestedTabs>
      <ClusterTab
        v-for="(cluster, idx) in dynamicListChildren"
        :key="cluster._id"
        :value="cluster"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="getDynamicListTabName(cluster)"
        @input="dynamicListUpdate"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>
