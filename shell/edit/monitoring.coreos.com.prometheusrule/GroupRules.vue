<script>
import has from 'lodash/has';

import Banner from '@shell/components/Banner';
import { removeAt } from '@shell/utils/array';
import { _VIEW } from '@shell/config/query-params';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import AlertingRule from './AlertingRule';
import RecordingRule from './RecordingRule';

export default {
  components: {
    ArrayListGrouped,
    AlertingRule,
    Banner,
    RecordingRule,
  },

  props: {
    value: {
      type:    Array,
      default: () => [],
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },

  computed: {
    recordingRules() {
      const { value: rules } = this;

      return rules.filter(rule => has(rule, 'record'));
    },
    alertingRules() {
      const { value: rules } = this;

      return rules.filter(rule => has(rule, 'alert'));
    },
    customRules() {
      const { value: rules } = this;

      return rules.filter(
        rule => !has(rule, 'alert') && !has(rule, 'record')
      );
    },
    hideRecordingRulesOnView() {
      return this.isView && (this.recordingRules || []).length === 0;
    },
    hideAlertingRulesOnView() {
      return this.isView && (this.alertingRules || []).length === 0;
    },
    isView() {
      return this.mode === _VIEW;
    },
    disableAddRecord() {
      const { value: rules } = this;

      return rules.find(rule => has(rule, 'alert'));
    },
    disableAddAlert() {
      const { value: rules } = this;

      return rules.find(rule => has(rule, 'record'));
    },
  },

  methods: {
    addRule(ruleType) {
      const { value } = this;

      switch (ruleType) {
      case 'record':
        value.push({ record: '', expr: '' });
        break;
      case 'alert':
        value.push({
          alert:  '',
          expr:   '',
          for:    '0s',
          labels: { severity: 'none' },
        });
        break;
      default:
        break;
      }
    },
    removeRule(ruleIndex) {
      removeAt(this.value, ruleIndex);
    },
  },
};
</script>

<template>
  <div class="container-group-rules">
    <div :class="[{ hide: hideRecordingRulesOnView }, 'container-recording-rules']">
      <h3 class="mt-20 mb-20">
        <t k="prometheusRule.recordingRules.label" />
        <i
          v-if="disableAddRecord"
          v-tooltip="t('validation.prometheusRule.groups.singleAlert')"
          class="icon icon-info"
        />
      </h3>
      <ArrayListGrouped :value="recordingRules">
        <template #default="props">
          <RecordingRule
            class="rule"
            :value="props.row.value"
            :mode="mode"
          />
        </template>
        <template #add>
          <button
            v-if="!isView"
            :disabled="disableAddRecord"
            type="button"
            class="btn role-tertiary"
            @click="addRule('record')"
          >
            <t k="prometheusRule.recordingRules.addLabel" />
          </button>
          <span v-else></span>
        </template>
        <template v-slot:remove-button="props">
          <button v-if="!isView" type="button" class="btn role-link close btn-sm" @click="removeRule(props.i)">
            <i class="icon icon-2x icon-x" />
          </button>
          <span v-else></span>
        </template>
      </ArrayListGrouped>
    </div>
    <div :class="[{ hide: hideAlertingRulesOnView }, 'container-alerting-rules']">
      <div class="mt-20 mb-20">
        <h3>
          <t k="prometheusRule.alertingRules.label" />
          <i
            v-if="disableAddAlert"
            v-tooltip="t('validation.prometheusRule.groups.singleAlert')"
            class="icon icon-info"
          />
        </h3>
        <Banner
          v-if="!isView"
          color="info"
          :label="t('prometheusRule.alertingRules.bannerText')"
        />
      </div>
      <ArrayListGrouped :value="alertingRules">
        <template #default="props">
          <AlertingRule
            class="rule"
            :value="props.row.value"
            :mode="mode"
          />
        </template>
        <template #add>
          <button
            v-if="!isView"
            :disabled="disableAddAlert"
            type="button"
            class="btn role-tertiary"
            @click="addRule('alert')"
          >
            <t k="prometheusRule.alertingRules.addLabel" />
          </button>
          <span v-else></span>
        </template>
        <template v-slot:remove-button="props">
          <button v-if="!isView" type="button" class="btn role-link close btn-sm" @click="removeRule(props.i)">
            <i class="icon icon-2x icon-x" />
          </button>
          <span v-else></span>
        </template>
      </ArrayListGrouped>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rules {
  .rule {
    border: solid 1px var(--border);
    padding: 20px;
    margin-bottom: 20px;
    position: relative;
  }
}
</style>
