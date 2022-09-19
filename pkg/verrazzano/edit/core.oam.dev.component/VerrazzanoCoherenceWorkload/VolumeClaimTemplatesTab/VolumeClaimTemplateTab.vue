<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import Labels from '@pkg/components/LabelsTab/Labels';
import PersistentVolumeClaimTab from '@pkg/components/PersistentVolumeClaimTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'VolumeClaimTemplateTab',
  components: {
    LabeledInput,
    Labels,
    PersistentVolumeClaimTab,
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
      type:    String,
      default: 'create'
    },
    tabName: {
      type:      String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: '',
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
      this.treeTabLabel = this.value.metadata?.name || this.t('verrazzano.common.tabs.persistentVolumeClaim');
    }
  },
};
</script>

<template>
  <TreeTab
    :name="treeTabName"
    :label="treeTabLabel"
    :title="t('verrazzano.coherence.titles.persistentVolumeClaimMetadata', { name: treeTabLabel })"
  >
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
          <LabeledInput
            :value="getField('metadata.name')"
            :mode="mode"
            disabled
            :placeholder="getNotSetPlaceholder(value, 'metadata.name')"
            :label="t('verrazzano.common.fields.name')"
            @input="setFieldIfNotEmpty('metadata.name', $event)"
          />
        </div>
      </div>
      <div class="spacer" />
      <div>
        <Labels
          :value="getField('metadata')"
          :mode="mode"
          @input="setFieldIfNotEmpty('metadata', $event)"
        />
      </div>
    </template>
    <template #nestedTabs>
      <PersistentVolumeClaimTab
        :value="getField('spec')"
        :mode="mode"
        disable-volume-name-editing
        :read-only-volume-name="getField('metadata.name')"
        :tab-name="createTabName(treeTabName, 'spec')"
        :tab-label="t('verrazzano.coherence.tabs.persistentVolumeClaimSpec')"
        @input="setFieldIfNotEmpty('spec', $event)"
        @delete="setField('spec', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
