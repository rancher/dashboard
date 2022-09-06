<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import CreateEditView from '@shell/mixins/create-edit-view';

export default {
  name:       'EditHarvesterLogging',
  components: {
    LabeledInput, Tabbed, Tab
  },

  mixins: [CreateEditView],

  props:  {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {};
  },

  created() {
    const resources = this.value.spec.values.additionalLoggingSources;

    if (!resources?.fluentbit) {
      this.$set(resources, 'fluentbit', {
        resources: {
          limits: {
            cpu:    '200m',
            memory: '200Mi'
          },
          requests: {
            cpu:    '50m',
            memory: '50Mi'
          }
        }
      });
    }

    if (!resources?.fluentd) {
      this.$set(resources, 'fluentd', {
        resources: {
          limits: {
            cpu:    '1000m',
            memory: '800Mi'
          },
          requests: {
            cpu:    '100m',
            memory: '20Mi'
          }
        }
      });
    }
  },
};
</script>

<template>
  <Tabbed :side-tabs="true">
    <Tab name="fluentbit" :label="t('harvester.logging.configuration.section.fluentbit')" :weight="-1">
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.additionalLoggingSources.fluentbit.resources.requests.cpu"
            :label="t('monitoring.prometheus.config.requests.cpu')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.additionalLoggingSources.fluentbit.resources.requests.memory"
            :label="t('monitoring.prometheus.config.requests.memory')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.additionalLoggingSources.fluentbit.resources.limits.cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.additionalLoggingSources.fluentbit.resources.limits.memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
    </Tab>
    <Tab name="fluentd" :label="t('harvester.logging.configuration.section.fluentd')" :weight="-1">
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.additionalLoggingSources.fluentd.resources.requests.cpu"
            :label="t('monitoring.prometheus.config.requests.cpu')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.additionalLoggingSources.fluentd.resources.requests.memory"
            :label="t('monitoring.prometheus.config.requests.memory')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.additionalLoggingSources.fluentd.resources.limits.cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :required="true"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.spec.values.additionalLoggingSources.fluentd.resources.limits.memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :required="true"
            :mode="mode"
          />
        </div>
      </div>
    </Tab>
  </Tabbed>
</template>

<style lang="scss" scoped>
  ::v-deep .radio-group {
    display: flex;
    .radio-container {
      margin-right: 30px;
    }
  }
</style>
