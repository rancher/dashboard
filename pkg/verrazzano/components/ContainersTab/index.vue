<script>
// Added by Verrazzano
import AddNamedElement from '@pkg/components/AddNamedElement';
import ContainerTab from '@pkg/components/ContainersTab/ContainerTab';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'ContainersTab',
  components: {
    AddNamedElement,
    ContainerTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper, DynamicListHelper],
  props:  {
    value: {
      type:    Array,
      default: () => ([])
    },
    mode: {
      type:    String,
      default: 'create'
    },
    useEphemeralContainers: {
      type:    Boolean,
      default: false
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
    typeLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:        this.tabName,
      treeTabLabel:       this.tabLabel,
      containerTypeLabel: this.typeLabel,
    };
  },
  methods: {
    getDynamicListTabName(child) {
      return this.createTabName(this.treeTabName, child?.name);
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.containers');
    }
    if (!this.containerTypeLabel) {
      this.containerTypeLabel = this.t('verrazzano.common.tabs.container');
    }
  }
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
        :add-type="containerTypeLabel"
        key-field-name="name"
        @input="dynamicListAddChild({ name: $event })"
      />
    </template>
    <template #nestedTabs>
      <ContainerTab
        v-for="(container, idx) in dynamicListChildren"
        :key="container._id"
        :value="container"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-label="container.name"
        :tab-name="getDynamicListTabName(container)"
        :type-label="containerTypeLabel"
        @input="dynamicListUpdate"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
