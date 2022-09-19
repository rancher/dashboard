<script>
// Added by Verrazzano
import AddNamedElement from '@pkg/components/AddNamedElement';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VolumeClaimTemplateTab
  from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/VolumeClaimTemplatesTab/VolumeClaimTemplateTab';

export default {
  name:       'VolumeClaimTemplatesTab',
  components: {
    AddNamedElement,
    TabDeleteButton,
    TreeTab,
    VolumeClaimTemplateTab,
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
      return this.createTabName(this.treeTabName, child?.metadata?.name);
    },
    getDynamicListRootFieldName() {
      return 'metadata.name';
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.persistentVolumeClaims');
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
        :value="value"
        :mode="mode"
        key-field-name="metadata.name"
        :add-type="t('verrazzano.common.tabs.persistentVolumeClaim')"
        @input="dynamicListAddChild({ metadata: { name: $event } })"
      />
    </template>
    <template #nestedTabs>
      <VolumeClaimTemplateTab
        v-for="(volumeClaim, idx) in dynamicListChildren"
        :key="volumeClaim._id"
        :value="volumeClaim"
        :mode="mode"
        :tab-name="createTabName(treeTabName, volumeClaim.metadata.name)"
        @input="dynamicListUpdate"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
