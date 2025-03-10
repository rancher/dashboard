<script>
import debounce from 'lodash/debounce';
import has from 'lodash/has';
import isEmpty from 'lodash/isEmpty';
import pickBy from 'lodash/pickBy';

import { Checkbox } from '@components/Form/Checkbox';
import CodeMirror from '@shell/components/CodeMirror';
import KeyValue from '@shell/components/form/KeyValue';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import UnitInput from '@shell/components/form/UnitInput';
import { _VIEW } from '@shell/config/query-params';
import { toSeconds } from '@shell/utils/duration';

const IGNORED_ANNOTATIONS = [
  'summary',
  'message',
  'description',
  'runbook_url',
];

export default {
  components: {
    Checkbox,
    CodeMirror,
    KeyValue,
    LabeledInput,
    LabeledSelect,
    UnitInput,
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

  data() {
    return {
      selectedSeverityLabel: null,
      ignoredAnnotations:    IGNORED_ANNOTATIONS,
      severityOptions:       [
        {
          label: this.t('prometheusRule.alertingRules.labels.severity.choices.critical'),
          value: 'critical'
        },
        {
          label: this.t('prometheusRule.alertingRules.labels.severity.choices.warning'),
          value: 'warning'
        },
        {
          label: this.t('prometheusRule.alertingRules.labels.severity.choices.none'),
          value: 'none'
        },
      ],
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    severityLabelChecked: {
      get() {
        if (has(this.value?.labels, 'severity')) {
          return true;
        }

        return false;
      },
      set(value) {
        if (value) {
          if (isEmpty(this.value?.labels)) {
            this.value['labels'] = { severity: 'none' };
          } else {
            this.value.labels['severity'] = 'none';
          }
        } else {
          this.value.labels['severity'] = '';
          delete this.value.labels.severity;
        }
      },
    },

    summaryAnnotationChecked: {
      get() {
        if (has(this.value?.annotations, 'summary')) {
          return true;
        }

        return false;
      },
      set(value) {
        if (value) {
          if (isEmpty(this.value?.annotations)) {
            this.value['annotations'] = { summary: '' };
          } else {
            this.value.annotations = { ...this.value.annotations, summary: '' };
          }
        } else {
          this.value.annotations['summary'] = '';
          delete this.value.annotations.summary;
        }
      },
    },

    messageAnnotationChecked: {
      get() {
        if (has(this.value?.annotations, 'message')) {
          return true;
        }

        return false;
      },
      set(value) {
        if (value) {
          if (isEmpty(this.value?.annotations)) {
            this.value['annotations'] = { message: '' };
          } else {
            this.value.annotations = { ...this.value.annotations, message: '' };
          }
        } else {
          this.value.annotations['message'] = '';
          delete this.value.annotations.message;
        }
      },
    },

    descriptionAnnotationChecked: {
      get() {
        if (has(this.value?.annotations, 'description')) {
          return true;
        }

        return false;
      },
      set(value) {
        if (value) {
          if (isEmpty(this.value?.annotations)) {
            this.value['annotations'] = { description: '' };
          } else {
            this.value.annotations = { ...this.value.annotations, description: '' };
          }
        } else {
          this.value.annotations['description'] = '';
          delete this.value.annotations.description;
        }
      },
    },

    runbookAnnotationChecked: {
      get() {
        if (has(this.value?.annotations, 'runbook_url')) {
          return true;
        }

        return false;
      },
      set(value) {
        if (value) {
          if (isEmpty(this.value?.annotations)) {
            this.value['annotations'] = { runbook_url: '' };
          } else {
            this.value.annotations = { ...this.value.annotations, runbook_url: '' };
          }
        } else {
          this.value.annotations['runbook_url'] = '';
          delete this.value.annotations.runbook_url;
        }
      },
    },

    filteredAnnotations() {
      const { ignoredAnnotations } = this;
      const annotations = this.value?.annotations;

      return pickBy(annotations, (value, key) => {
        return !ignoredAnnotations.includes(key);
      });
    },

    filteredLabels() {
      const labels = this.value?.labels;

      return pickBy(labels, (value, key) => {
        return key !== 'severity';
      });
    },

    showCustomSeverityInput() {
      const { selectedSeverityLabel } = this;

      if (selectedSeverityLabel === 'custom') {
        return true;
      }

      return false;
    },

    waitToFireFor: {
      get() {
        if (![null, undefined].includes(this.value.for)) {
          // see:
          // https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/#rule
          // https://prometheus.io/docs/prometheus/latest/configuration/configuration/#duration
          return toSeconds(this.value.for);
        }

        return undefined;
      },
      set(v) {
        this.value['for'] = [null, undefined].includes(v) ? undefined : `${ v }s`;
      }
    }
  },

  watch: {
    selectedSeverityLabel(value /* , oldValue */) {
      const neu = value === 'custom' ? '' : value;

      if (this.value?.labels) {
        this.value.labels['severity'] = neu;
      } else {
        this.value['labels'] = { severity: neu };
      }
    },
  },

  created() {
    this.queueUpdate = debounce(this.updateExpression, 500);
    this.queueLabelUpdate = debounce(this.updateLabels, 500);
    this.queueAnnotationUpdate = debounce(this.updateAnnotations, 500);
  },

  mounted() {
    this.$nextTick(() => {
      if (this.value?.labels?.severity) {
        this.selectedSeverityLabel = this.value.labels.severity;
      }
    });
  },

  methods: {
    updateLabels(value) {
      const neu = { ...value };

      if (this.selectedSeverityLabel) {
        neu['severity'] = this.selectedSeverityLabel;
      }

      this.value['labels'] = neu;
    },
    updateAnnotations(value) {
      const {
        ignoredAnnotations,
        value: { annotations = {} },
      } = this;
      const neu = { ...value };

      ignoredAnnotations.forEach((anno) => {
        if (has(annotations, anno)) {
          neu[anno] = annotations[anno];
        }
      });

      this.value['annotations'] = neu;
    },
    updateExpression(value) {
      this.value['expr'] = value;
    }
  },
};
</script>

<template>
  <div>
    <div class="row mt-25">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.alert"
          :label="t('prometheusRule.alertingRules.name')"
          :required="true"
          :mode="mode"
          data-testid="v2-monitoring-alerting-rules-alert-name"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model:value="waitToFireFor"
          :suffix="t('suffix.seconds', {count: value.for})"
          :placeholder="t('prometheusRule.alertingRules.for.placeholder')"
          :label="t('prometheusRule.alertingRules.for.label')"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <LabeledInput
          v-model:value="value.expr"
          :label="t('prometheusRule.promQL.label')"
          :required="true"
          :mode="mode"
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
              data-testid="v2-monitoring-alerting-rules-promql"
              @onInput="queueUpdate"
            />
          </template>
        </LabeledInput>
      </div>
    </div>
    <div class="suggested-labels">
      <div class="row mb-0 mt-30">
        <div class="col span-12">
          <h3>
            <t k="prometheusRule.alertingRules.labels.label" />
          </h3>
        </div>
      </div>
      <div :class="[{ hide: isView && !severityLabelChecked }, 'row']">
        <div
          v-if="isView && severityLabelChecked"
          class="col span-6 severity"
        >
          <label><t k="prometheusRule.alertingRules.labels.severity.label" /></label>
          <div>{{ value.labels.severity }}</div>
        </div>
        <div
          v-else
          class="severity col span-6"
        >
          <Checkbox
            v-model:value="severityLabelChecked"
            :mode="mode"
            :label="t('prometheusRule.alertingRules.labels.severity.label')"
          />
          <LabeledSelect
            v-if="severityLabelChecked"
            v-model:value="value.labels.severity"
            class="mt-10"
            :mode="mode"
            :label="t('prometheusRule.alertingRules.labels.severity.choices.label')"
            :localized-label="false"
            :options="severityOptions"
            data-testid="v2-monitoring-alerting-rules-severity"
          />
        </div>
      </div>
      <div :class="[{ hide: isView && Object.keys(filteredLabels).length === 0}, 'row', 'mt-0']">
        <div class="col span-12">
          <KeyValue
            key="labels"
            :value="filteredLabels"
            :add-label="t('labels.addLabel')"
            :mode="mode"
            :read-allowed="false"
            :value-multiline="false"
            @update:value="queueLabelUpdate"
          />
        </div>
      </div>
      <div class="suggested-annotations">
        <div class="row mb-0 mt-30">
          <div class="col span-12">
            <h3>
              <t k="prometheusRule.alertingRules.annotations.label" />
            </h3>
          </div>
        </div>
        <div class="row mt-0 mb-0">
          <div class="col span-12">
            <div :class="[{ hide: isView && !summaryAnnotationChecked }, 'row']">
              <div
                v-if="isView && summaryAnnotationChecked"
                class="col span-6 annotation-checkbox-container"
              >
                <label>
                  <t k="prometheusRule.alertingRules.annotations.summary.label" />
                </label>
                <div>{{ value.annotations.summary }}</div>
              </div>
              <div
                v-else
                class="col span-6 annotation-checkbox-container"
              >
                <Checkbox
                  v-model:value="summaryAnnotationChecked"
                  :mode="mode"
                  :label="t('prometheusRule.alertingRules.annotations.summary.label')"
                />
                <LabeledInput
                  v-if="summaryAnnotationChecked"
                  v-model:value="value.annotations.summary"
                  class="mt-5"
                  :label="t('prometheusRule.alertingRules.annotations.summary.input')"
                  type="multiline"
                  :mode="mode"
                />
              </div>
            </div>
            <div :class="[{ hide: isView && !messageAnnotationChecked }, 'row']">
              <div
                v-if="isView && messageAnnotationChecked"
                class="col span-6 annotation-checkbox-container"
              >
                <label><t
                  k="prometheusRule.alertingRules.annotations.message.label"
                /></label>
                <div>{{ value.annotations.message }}</div>
              </div>
              <div
                v-else
                class="col span-6 annotation-checkbox-container"
              >
                <Checkbox
                  v-model:value="messageAnnotationChecked"
                  :mode="mode"
                  :label="t('prometheusRule.alertingRules.annotations.message.label')"
                />
                <LabeledInput
                  v-if="messageAnnotationChecked"
                  v-model:value="value.annotations.message"
                  class="mt-5"
                  :label="t('prometheusRule.alertingRules.annotations.message.input')"
                  type="multiline"
                  :mode="mode"
                />
              </div>
            </div>
            <div :class="[ { hide: isView && !descriptionAnnotationChecked }, 'row']">
              <div
                v-if="isView && descriptionAnnotationChecked"
                class="col span-6 annotation-checkbox-container"
              >
                <label><t
                  k="prometheusRule.alertingRules.annotations.description.label"
                /></label>
                <div>{{ value.annotations.description }}</div>
              </div>
              <div
                v-else
                class="col span-6 annotation-checkbox-container"
              >
                <Checkbox
                  v-model:value="descriptionAnnotationChecked"
                  :mode="mode"
                  :label="t('prometheusRule.alertingRules.annotations.description.label')"
                />
                <LabeledInput
                  v-if="descriptionAnnotationChecked"
                  v-model:value="value.annotations.description"
                  class="mt-5"
                  :label="t('prometheusRule.alertingRules.annotations.description.input')"
                  type="multiline"
                  :mode="mode"
                />
              </div>
            </div>
            <div :class="[{ hide: isView && !runbookAnnotationChecked }, 'row']">
              <div
                v-if="isView && runbookAnnotationChecked"
                class="col span-6 annotation-checkbox-container"
              >
                <label>
                  <t k="prometheusRule.alertingRules.annotations.runbook.label" />
                </label>
                <div>{{ value.annotations.runbook_url }}</div>
              </div>
              <div
                v-else
                class="col span-6 annotation-checkbox-container"
              >
                <Checkbox
                  v-model:value="runbookAnnotationChecked"
                  :mode="mode"
                  :label="t('prometheusRule.alertingRules.annotations.runbook.label')"
                />
                <LabeledInput
                  v-if="runbookAnnotationChecked"
                  v-model:value="value.annotations.runbook_url"
                  class="mt-5"
                  :label="t('prometheusRule.alertingRules.annotations.runbook.input')"
                  type="multiline"
                  :mode="mode"
                />
              </div>
            </div>
          </div>
        </div>
        <div :class="[{ hide: isView && Object.keys(filteredAnnotations).length === 0}, 'row', 'mt-0']">
          <KeyValue
            key="annotations"
            :value="filteredAnnotations"
            :add-label="t('labels.addAnnotation')"
            :mode="mode"
            :read-allowed="false"
            @update:value="queueAnnotationUpdate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.row {
  margin: 20px 0;
}
.remove {
  position: absolute;
  top: 0;
  right: 5px;
}

.promql-input {
  width: 100%;
}
</style>
