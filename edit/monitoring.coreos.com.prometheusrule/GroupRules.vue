<script>
import has from 'lodash/has';

import Banner from '@/components/Banner';
import { removeAt } from '@/utils/array';
import { _VIEW } from '@/config/query-params';
import AlertingRule from './AlertingRule';
import RecordingRule from './RecordingRule';

export default {
  components: {
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
          labels: { severity: 'critical' },
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
          style="font-size: 14px"
        />
      </h3>
      <div v-if="recordingRules.length > 0" class="rules">
        <template v-for="(record, idx) in recordingRules">
          <RecordingRule
            :key="'recordind-rule-' + idx"
            class="rule"
            :value="record"
            :mode="mode"
            :rule-index="idx"
            @removeRule="removeRule"
          />
        </template>
      </div>

      <button
        v-if="!isView"
        :disabled="disableAddRecord"
        type="button"
        class="btn btn-sm role-secondary"
        @click="addRule('record')"
      >
        <t k="prometheusRule.recordingRules.addLabel" />
      </button>
    </div>
    <div :class="[{ hide: hideAlertingRulesOnView }, 'container-alerting-rules']">
      <div class="mt-20 mb-20">
        <h3 class="mb-0">
          <t k="prometheusRule.alertingRules.label" />
          <i
            v-if="disableAddAlert"
            v-tooltip="t('validation.prometheusRule.groups.singleAlert')"
            class="icon icon-info"
            style="font-size: 14px"
          />
        </h3>
        <Banner
          v-if="!isView"
          color="info"
          :label="t('prometheusRule.alertingRules.bannerText')"
        />
      </div>
      <div v-if="alertingRules.length > 0" class="rules">
        <template v-for="(record, idx) in alertingRules">
          <AlertingRule
            :key="'alerting-rule-' + idx"
            class="rule"
            :value="record"
            :mode="mode"
            :rule-index="idx"
            @removeRule="removeRule"
          />
        </template>
      </div>
      <button
        v-if="!isView"
        :disabled="disableAddAlert"
        type="button"
        class="btn btn-sm role-secondary"
        @click="addRule('alert')"
      >
        <t k="prometheusRule.alertingRules.addLabel" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rules {
  .rule {
    border: solid thin var(--border);
    padding: 20px;
    margin-bottom: 20px;
    position: relative;
  }
}
</style>
