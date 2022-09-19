<script>
// Added by Verrazzano
import AddNamedElement from '@pkg/components/AddNamedElement';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import NamedPortSpecTab
  from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/NamedPortsSpecTab/NamedPortSpecTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'NamedPortsSpecTab',
  components: {
    AddNamedElement,
    NamedPortSpecTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [CoherenceWorkloadHelper, DynamicListHelper],
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
      return this.createTabName(this.treeTabName, child?.name);
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.ports');
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
        key-field-name="name"
        :add-type="t('verrazzano.coherence.tabs.port')"
      />
    </template>
    <template #nestedTabs>
      <NamedPortSpecTab
        v-for="(port, idx) in dynamicListChildren"
        :key="port._id"
        :value="port"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, port.name)"
        :tab-label="port.name"
        @input="dynamicListUpdate"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
