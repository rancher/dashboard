<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import JobSpecTab from '@pkg/components/JobSpecTab';
import LabelsTab from '@pkg/components/LabelsTab';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'ActionJobTab',
  components: {
    JobSpecTab,
    LabelsTab,
    TreeTab,
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
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.actions');
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #nestedTabs>
      <LabelsTab
        :value="value"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'labels')"
        @input="$emit('input', value)"
      />
      <JobSpecTab
        :value="getField('spec')"
        :mode="mode"
        :namespaced-object="namespacedObject"
        :tab-name="createTabName(treeTabName, 'jobSpec')"
        @input="setFieldIfNotEmpty('spec', $event)"
        @delete="setField('spec', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
