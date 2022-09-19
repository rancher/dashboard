<script>
// Added by Verrazzano
import AddNamedElement from '@pkg/components/AddNamedElement';
import DynamicListHelper from '@pkg/mixins/dynamic-list-helper';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VolumeTab from '@pkg/components/VolumesTab/VolumeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'VolumesTab',
  components: {
    AddNamedElement,
    TabDeleteButton,
    TreeTab,
    VolumeTab,
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
    },
    addVolume(name) {
      this.dynamicListAddChild({ name });
    },
    removeVolume(index) {
      this.dynamicListDeleteChildByIndex(index);
    },
    deleteVolumes() {
      this.dynamicListClearChildrenList();
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.volumes');
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
        @click="deleteVolumes()"
      />
    </template>
    <template #default>
      <AddNamedElement
        :value="dynamicListChildren"
        :mode="mode"
        key-field-name="name"
        :add-type="t('verrazzano.common.tabs.volume')"
        :field-label="t('verrazzano.common.fields.volume.name')"
        @input="addVolume($event)"
      />
    </template>
    <template #nestedTabs>
      <VolumeTab
        v-for="(volume, idx) in dynamicListChildren"
        :key="volume._id"
        :value="volume"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, volume.name)"
        :tab-label="volume.name"
        @input="dynamicListUpdate()"
        @delete="dynamicListDeleteChildByIndex(idx)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
