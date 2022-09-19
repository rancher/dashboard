<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import PersistentVolumeClaimTab from '@pkg/components/PersistentVolumeClaimTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VolumeTab from '@pkg/components/VolumesTab/VolumeTab';

export default {
  name:       'PersistenceStorageSpecTab',
  components: {
    PersistentVolumeClaimTab,
    TabDeleteButton,
    TreeTab,
    VolumeTab,
  },
  mixins: [CoherenceWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
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
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.snapshots');
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
      <PersistentVolumeClaimTab
        :value="getField('persistentVolumeClaim')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'persistentVolumeClaim')"
        @input="setFieldIfNotEmpty('persistentVolumeClaim', $event)"
        @delete="setField('persistentVolumeClaim', undefined)"
      />
      <VolumeTab
        :value="getField('volume')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        name-is-editable
        :tab-name="createTabName(treeTabName, 'volume')"
        @input="setFieldIfNotEmpty('volume', $event)"
        @delete="setField('volume', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
