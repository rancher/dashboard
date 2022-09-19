<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'JVMMemorySpecTab',
  components: {
    Checkbox,
    LabeledInput,
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
    nativeMemoryTrackingOptions() {
      return [
        { value: 'off', label: this.t('verrazzano.coherence.types.nativeMemoryTracking.off') },
        { value: 'summary', label: this.t('verrazzano.coherence.types.nativeMemoryTracking.summary') },
        { value: 'detail', label: this.t('verrazzano.coherence.types.nativeMemoryTracking.detail') },
      ];
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.name || this.t('verrazzano.coherence.tabs.jvmMemory');
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
      <div>
        <div class="row">
          <div class="col span-4">
            <div class="spacer-tiny" />
            <Checkbox
              :value="getField('onOutOfMemory.exit')"
              :mode="mode"
              :label="t('verrazzano.coherence.fields.onOutOfMemory.exit')"
              @input="setBooleanField('onOutOfMemory.exit', $event)"
            />
            <div class="spacer-tiny" />
            <Checkbox
              :value="getField('onOutOfMemory.heapDump')"
              :mode="mode"
              :label="t('verrazzano.coherence.fields.onOutOfMemory.heapDump')"
              @input="setBooleanField('onOutOfMemory.heapDump', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-3">
            <LabeledInput
              :value="getField('heapSize')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'heapSize')"
              :label="t('verrazzano.coherence.fields.heapSize')"
              @input="setFieldIfNotEmpty('heapSize', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('initialHeapSize')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'initialHeapSize')"
              :label="t('verrazzano.coherence.fields.initialHeapSize')"
              @input="setFieldIfNotEmpty('initialHeapSize', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('maxHeapSize')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'maxHeapSize')"
              :label="t('verrazzano.coherence.fields.maxHeapSize')"
              @input="setFieldIfNotEmpty('maxHeapSize', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('maxRAM')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'maxRAM')"
              :label="t('verrazzano.coherence.fields.maxRAM')"
              @input="setFieldIfNotEmpty('maxRAM', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-3">
            <LabeledInput
              :value="getField('percentage')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'percentage')"
              :label="t('verrazzano.coherence.fields.heapPercentage')"
              @input="setFieldIfNotEmpty('percentage', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('initialRAMPercentage')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'initialRAMPercentage')"
              :label="t('verrazzano.coherence.fields.initialRAMPercentage')"
              @input="setFieldIfNotEmpty('initialRAMPercentage', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('minRAMPercentage')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'minRAMPercentage')"
              :label="t('verrazzano.coherence.fields.minRAMPercentage')"
              @input="setFieldIfNotEmpty('minRAMPercentage', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('maxRAMPercentage')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'maxRAMPercentage')"
              :label="t('verrazzano.coherence.fields.maxRAMPercentage')"
              @input="setFieldIfNotEmpty('maxRAMPercentage', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-3">
            <LabeledInput
              :value="getField('stackSize')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'stackSize')"
              :label="t('verrazzano.coherence.fields.stackSize')"
              @input="setFieldIfNotEmpty('stackSize', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('metaspaceSize')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'metaspaceSize')"
              :label="t('verrazzano.coherence.fields.metaspaceSize')"
              @input="setFieldIfNotEmpty('metaspaceSize', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledInput
              :value="getField('directMemorySize')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'directMemorySize')"
              :label="t('verrazzano.coherence.fields.directMemorySize')"
              @input="setFieldIfNotEmpty('directMemorySize', $event)"
            />
          </div>
          <div class="col span-3">
            <LabeledSelect
              :value="getField('nativeMemoryTracking')"
              :mode="mode"
              :options="nativeMemoryTrackingOptions"
              option-key="value"
              option-label="label"
              :placeholder="getNotSetPlaceholder(value, 'nativeMemoryTracking')"
              :label="t('verrazzano.coherence.fields.nativeMemoryTracking')"
              @input="setFieldIfNotEmpty('nativeMemoryTracking', $event)"
            />
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
