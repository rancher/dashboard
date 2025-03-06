<script>
import debounce from 'lodash/debounce';

import CodeMirror from '@shell/components/CodeMirror';
import { LabeledInput } from '@components/Form/LabeledInput';
import KeyValue from '@shell/components/form/KeyValue';
import { _VIEW } from '@shell/config/query-params';

export default {
  components: {
    CodeMirror,
    LabeledInput,
    KeyValue,
  },

  props: {
    value: {
      type:    Object,
      default: () => ({}),
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    labels() {
      return (this.value?.labels || {});
    },
  },

  created() {
    this.queueUpdate = debounce(this.updateExpression, 500);
    this.queueLabelUpdate = debounce(this.updateLabels, 500);
  },

  methods: {
    updateExpression(value) {
      this.value['expr'] = value;
    },
    updateLabels(value) {
      this.value['labels'] = value;
    },
  }
};
</script>

<template>
  <div>
    <div class="row mt-25">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.record"
          :label="t('prometheusRule.recordingRules.name')"
          :required="true"
          data-testid="v2-monitoring-prom-rules-recording-name"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <LabeledInput
          v-model:value="value.expr"
          :label="t('prometheusRule.promQL.label')"
          :required="true"
        >
          <template #field>
            <CodeMirror
              class="mt-20 promql-input"
              :value="value.expr"
              :options="{
                mode: null,
                foldGutter: false,
                readOnly: mode === 'view',
              }"
              data-testid="v2-monitoring-prom-rules-recording-promql"
              @onInput="queueUpdate"
            />
          </template>
        </LabeledInput>
      </div>
    </div>
    <div :class="[{ hide: isView && Object.keys(labels).length === 0}, 'row']">
      <div class="col span-12">
        <KeyValue
          key="labels"
          :value="value.labels"
          :add-label="t('labels.addLabel')"
          :mode="mode"
          :title="t('prometheusRule.recordingRules.labels')"
          :read-allowed="false"
          @input="queueLabelUpdate"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.row {
  margin: 20px 0;
}

.promql-input {
  width: 100%;
}
</style>
