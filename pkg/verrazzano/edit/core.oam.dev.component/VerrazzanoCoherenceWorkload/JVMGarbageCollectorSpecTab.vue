<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'JVMGarbageCollectorSpecTab',
  components: {
    Checkbox,
    LabeledArrayList,
    LabeledSelect,
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
  computed: {
    collectors() {
      return [
        { value: 'Default', label: this.t('verrazzano.coherence.types.gcTypes.default') },
        { value: 'G1', label: this.t('verrazzano.coherence.types.gcTypes.g1') },
        { value: 'CMS', label: this.t('verrazzano.coherence.types.gcTypes.cms') },
        { value: 'Parallel', label: this.t('verrazzano.coherence.types.gcTypes.parallel') },
      ];
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.name || this.t('verrazzano.coherence.tabs.jvmGC');
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
    <template #default>
      <div class="row">
        <div class="col span-6">
          <div class="spacer-small" />
          <Checkbox
            :value="getField('logging')"
            :mode="mode"
            :label="t('verrazzano.coherence.fields.garbageCollectorLogging')"
            @input="setBooleanField('logging', $event)"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            :value="getField('collector')"
            :mode="mode"
            :options="collectors"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'collector')"
            :label="t('verrazzano.coherence.fields.garbageCollector')"
            @input="setFieldIfNotEmpty('collector', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-6">
          <LabeledArrayList
            :value="getListField('args')"
            :mode="mode"
            :value-label="t('verrazzano.coherence.fields.garbageCollectorArg')"
            :add-label="t('verrazzano.coherence.buttons.addGarbageCollectorArg')"
            @input="setFieldIfNotEmpty('args', $event)"
          />
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
