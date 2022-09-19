<script>
// Added by Verrazzano
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledArrayList from '@pkg/components/LabeledArrayList';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';

export default {
  name:       'PrometheusRelabelConfigTab',
  components: {
    LabeledArrayList,
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
    namespacedObject: {
      type:     Object,
      required: true
    },
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:     String,
      required: true
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
    };
  },
  computed: {
    actionOptions() {
      return [
        { value: 'replace', label: this.t('verrazzano.coherence.types.relabelAction.replace') },
        { value: 'lowercase', label: this.t('verrazzano.coherence.types.relabelAction.lowercase') },
        { value: 'uppercase', label: this.t('verrazzano.coherence.types.relabelAction.uppercase') },
        { value: 'keep', label: this.t('verrazzano.coherence.types.relabelAction.keep') },
        { value: 'drop', label: this.t('verrazzano.coherence.types.relabelAction.drop') },
        { value: 'hashmod', label: this.t('verrazzano.coherence.types.relabelAction.hashmod') },
        { value: 'labelmap', label: this.t('verrazzano.coherence.types.relabelAction.labelmap') },
        { value: 'labeldrop', label: this.t('verrazzano.coherence.types.relabelAction.labeldrop') },
        { value: 'labelkeep', label: this.t('verrazzano.coherence.types.relabelAction.labelkeep') },
      ];
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
            <LabeledSelect
              :value="getField('action')"
              :mode="mode"
              :options="actionOptions"
              option-key="value"
              option-label="label"
              :placeholder="getNotSetPlaceholder(value, 'action')"
              :label="t('verrazzano.coherence.fields.relabelConfig.action')"
              @input="setFieldIfNotEmpty('action', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('separator')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'separator')"
              :label="t('verrazzano.coherence.fields.relabelConfig.separator')"
              @input="setFieldIfNotEmpty('separator', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('targetLabel')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'targetLabel')"
              :label="t('verrazzano.coherence.fields.relabelConfig.targetLabel')"
              @input="setFieldIfNotEmpty('targetLabel', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('regex')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'regex')"
              :label="t('verrazzano.coherence.fields.relabelConfig.regex')"
              @input="setFieldIfNotEmpty('regex', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('modulus')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'modulus')"
              :label="t('verrazzano.coherence.fields.relabelConfig.modulus')"
              @input="setNumberField('modulus', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('replacement')"
              :mode="mode"
              :placeholder="getNotSetPlaceholder(value, 'replacement')"
              :label="t('verrazzano.coherence.fields.relabelConfig.replacement')"
              @input="setFieldIfNotEmpty('replacement', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-6">
            <LabeledArrayList
              :value="getListField('sourceLabels')"
              :mode="mode"
              :value-label="t('verrazzano.coherence.fields.relabelConfig.sourceLabel')"
              :add-label="t('verrazzano.coherence.buttons.addSourceLabel')"
              @input="setFieldIfNotEmpty('sourceLabels', $event)"
            />
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
