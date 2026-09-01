<script>

import { _EDIT } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped.vue';

export default {
  components: {
    ArrayListGrouped,
    LabeledInput,
    LabeledSelect
  },
  props: {
    value: {
      type:    Object,
      default: () => {
      }
    },
    mode: {
      type:    String,
      default: _EDIT
    },
    type: {
      type:    String,
      default: 'scaleUp'
    },
  },
  data() {
    if (!this.value.spec.behavior[this.type].policies) {
      this.value.spec.behavior[this.type]['policies'] = [];
    }
    if (!this.value.spec.behavior[this.type].selectPolicy) {
      this.value.spec.behavior[this.type]['selectPolicy'] = 'Max';
    }
    if (this.value.spec.behavior[this.type].stabilizationWindowSeconds === null || typeof this.value.spec.behavior[this.type].stabilizationWindowSeconds === 'undefined') {
      if (this.type === 'scaleUp') {
        this.value.spec.behavior[this.type]['stabilizationWindowSeconds'] = 0;
      }
      if (this.type === 'scaleDown') {
        this.value.spec.behavior[this.type]['stabilizationWindowSeconds'] = 300;
      }
    }

    return { selectPolicyOptions: ['Max', 'Min', 'Disabled'], policyTypeOptions: ['Pods', 'Percent'] };
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-12">
        <ArrayListGrouped
          v-model:value="value.spec.behavior[type].policies"
          :add-label="t('hpa.scalingRule.addPolicy')"
          :default-add-value="{}"
          :mode="mode"
        >
          <template #default="props">
            <div class="row">
              <div class="col span-4">
                <LabeledSelect
                  v-model:value="props.row.value.type"
                  :mode="mode"
                  :options="policyTypeOptions"
                  :multiple="false"
                  :taggable="true"
                  :searchable="true"
                  :required="true"
                  :tooltip="t('hpa.scalingRule.policy.typeTooltip')"
                  :label="t('hpa.scalingRule.policy.type')"
                />
              </div>
              <div class="col span-4">
                <LabeledInput
                  v-model:value.number="props.row.value.value"
                  :mode="mode"
                  type="number"
                  min="1"
                  :required="true"
                  :tooltip="t('hpa.scalingRule.policy.valueTooltip')"
                  :label="t('hpa.scalingRule.policy.value')"
                />
              </div>
              <div class="col span-4">
                <LabeledInput
                  v-model:value.number="props.row.value.periodSeconds"
                  :mode="mode"
                  type="number"
                  min="1"
                  max="1800"
                  :required="true"
                  :tooltip="t('hpa.scalingRule.policy.periodSecondsTooltip')"
                  :label="t('hpa.scalingRule.policy.periodSeconds')"
                />
              </div>
            </div>
          </template>
        </ArrayListGrouped>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.spec.behavior[type].selectPolicy"
          :mode="mode"
          :options="selectPolicyOptions"
          :multiple="false"
          :taggable="true"
          :searchable="true"
          :label="t('hpa.scalingRule.selectPolicy')"
          :tooltip="t('hpa.scalingRule.selectPolicyTooltip')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value.number="value.spec.behavior[type].stabilizationWindowSeconds"
          :mode="mode"
          type="number"
          min="0"
          max="3600"
          :label="t('hpa.scalingRule.stabilizationWindowSeconds')"
          :tooltip="t('hpa.scalingRule.stabilizationWindowSecondsTooltip')"
        />
      </div>
    </div>
    <div class="row mb-40" />
  </div>
</template>
