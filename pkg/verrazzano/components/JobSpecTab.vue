<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import PodAffinityTerm from '@pkg/components/PodAffinityTerm';
import PodTemplateTab from '@pkg/components/PodTemplateTab';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'JobSpecTab',
  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
    PodAffinityTerm,
    PodTemplateTab,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [VerrazzanoHelper],
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
      required: true,
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
    completionModeOptions() {
      return [
        { value: 'NonIndexed', label: this.t('verrazzano.common.types.completionMode.nonIndexed') },
        { value: 'Indexed', label: this.t('verrazzano.common.types.completionMode.indexed') },
      ];
    }
  },
  created() {
    if (!this.treeTabLabel) {
      this.treeTabLabel = this.t('verrazzano.common.tabs.jobSpec');
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
        @click="$emit('delete')"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('activeDeadlineSeconds')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'activeDeadlineSeconds')"
            :label="t('verrazzano.common.fields.jobSpec.activeDeadlineSeconds')"
            @input="setNumberField('activeDeadlineSeconds', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('backoffLimit')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'backoffLimit')"
            :label="t('verrazzano.common.fields.jobSpec.backoffLimit')"
            @input="setNumberField('backoffLimit', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('ttlSecondsAfterFinished')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'ttlSecondsAfterFinished')"
            :label="t('verrazzano.common.fields.jobSpec.ttlSecondsAfterFinished')"
            @input="setNumberField('ttlSecondsAfterFinished', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <LabeledSelect
            :value="getField('completionMode')"
            :mode="mode"
            :options="completionModeOptions"
            option-key="value"
            option-label="label"
            :placeholder="getNotSetPlaceholder(value, 'completionMode')"
            :label="t('verrazzano.common.fields.jobSpec.completionMode')"
            @input="setFieldIfNotEmpty('completionMode', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('completions')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'completions')"
            :label="t('verrazzano.common.fields.jobSpec.completions')"
            @input="setNumberField('completions', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            :value="getField('parallelism')"
            :mode="mode"
            type="Number"
            min="0"
            :placeholder="getNotSetPlaceholder(value, 'parallelism')"
            :label="t('verrazzano.common.fields.jobSpec.parallelism')"
            @input="setNumberField('parallelism', $event)"
          />
        </div>
      </div>
      <div class="spacer-small" />
      <div class="row">
        <div class="col span-4">
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('suspend')"
            :mode="mode"
            :label="t('verrazzano.common.fields.jobSpec.suspend')"
            @input="setBooleanField('suspend', $event)"
          />
          <div class="spacer-tiny" />
          <Checkbox
            :value="getField('manualSelector')"
            :mode="mode"
            :label="t('verrazzano.common.fields.jobSpec.manualSelector')"
            @input="setBooleanField('manualSelector', $event)"
          />
        </div>
      </div>
    </template>
    <template #nestedTabs>
      <TreeTab :name="createTabName(treeTabName, 'labelSelector')" :label="t('verrazzano.common.tabs.labelSelector')">
        <PodAffinityTerm
          :value="getField('selector')"
          :mode="mode"
          :match-expressions-title="t('verrazzano.common.title.jobSpec.matchExpressions')"
          :match-labels-title="t('verrazzano.common.title.jobSpec.matchLabels')"
          @input="setFieldIfNotEmpty('labelSelector', $event)"
        />
      </TreeTab>
      <PodTemplateTab
        :value="getField('template')"
        :mode="mode"
        namespaced-object="namespaceObject"
        :tab-name="createTabName(treeTabName, 'template')"
        @input="setFieldIfNotEmpty('template', $event)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
