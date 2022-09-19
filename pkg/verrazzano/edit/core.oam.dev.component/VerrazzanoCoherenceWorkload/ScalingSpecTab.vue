<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ProbeTab from '@pkg/edit/core.oam.dev.component/VerrazzanoCoherenceWorkload/ProbeTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'ScalingSpecTab',
  components: {
    LabeledSelect,
    ProbeTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [CoherenceWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:     String,
      default: 'create'
    },
    tabName: {
      type:     String,
      required: true,
    },
    tabLabel: {
      type:     String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  computed: {
    scalingPolicyOptions() {
      return [
        { value: 'Safe', label: this.t('verrazzano.coherence.types.scalingPolicy.safe') },
        { value: 'Parallel', label: this.t('verrazzano.coherence.types.scalingPolicy.parallel') },
        { value: 'ParallelUpSafeDown', label: this.t('verrazzano.coherence.types.scalingPolicy.parallelUpSafeDown') },
      ];
    },
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.coherence.tabs.scaling');
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
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <LabeledSelect
            :value="getField('policy')"
            :mode="mode"
            :options="scalingPolicyOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'policy')"
            :label="t('verrazzano.coherence.fields.scalingSpec.policy')"
            @input="setFieldIfNotEmpty('policy', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <ProbeTab
        :value="getField('probe')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'probe')"
        :tab-label="t('verrazzano.coherence.tabs.scalingProbe')"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
