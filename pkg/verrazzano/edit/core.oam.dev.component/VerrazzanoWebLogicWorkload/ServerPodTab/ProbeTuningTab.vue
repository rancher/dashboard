<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import WeblogicWorkloadHelper from '@pkg/mixins/weblogic-workload-helper';

export default {
  name:       'ProbeTuningTab',
  components: {
    LabeledInput,
    TabDeleteButton,
    TreeTab,
  },
  mixins: [WeblogicWorkloadHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    isReadinessProbe: {
      type:    Boolean,
      default: false
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
            <LabeledInput
              :value="getField('initialDelaySeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'initialDelaySeconds')"
              :label="t('verrazzano.common.fields.containerProbe.initialDelaySeconds')"
              @input="setNumberField('initialDelaySeconds', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('periodSeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'periodSeconds')"
              :label="t('verrazzano.common.fields.containerProbe.periodSeconds')"
              @input="setNumberField('periodSeconds', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('timeoutSeconds')"
              :mode="mode"
              type="Number"
              min="0"
              :placeholder="getNotSetPlaceholder(value, 'timeoutSeconds')"
              :label="t('verrazzano.common.fields.containerProbe.timeoutSeconds')"
              @input="setNumberField('timeoutSeconds', $event)"
            />
          </div>
        </div>
        <div class="spacer-small" />
        <div class="row">
          <div class="col span-4">
            <LabeledInput
              :value="getField('failureThreshold')"
              :mode="mode"
              type="Number"
              min="1"
              :placeholder="getNotSetPlaceholder(value, 'failureThreshold')"
              :label="t('verrazzano.common.fields.containerProbe.failureThreshold')"
              @input="setNumberField('failureThreshold', $event)"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              :value="getField('successThreshold')"
              :mode="mode"
              :disabled="!isReadinessProbe"
              type="Number"
              min="1"
              :placeholder="getNotSetPlaceholder(value, 'successThreshold')"
              :label="t('verrazzano.common.fields.containerProbe.successThreshold')"
              @input="setNumberField('successThreshold', $event)"
            />
          </div>
        </div>
      </div>
    </template>
  </TreeTab>
</template>

<style scoped>

</style>
