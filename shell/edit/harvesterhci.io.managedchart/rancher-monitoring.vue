<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import CreateEditView from '@shell/mixins/create-edit-view';

export default {
  name:       'EditHarvesterMonitoring',
  components: { LabeledInput },

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
    const resources = this.value.spec.values.prometheus.prometheusSpec.resources;

    if (!resources?.limits) {
      this.$set(resources, 'limits', {});
    }

    this.$set(resources.requests, 'cpu', resources?.requests?.cpu || '');
    this.$set(resources.requests, 'memory', resources?.requests?.memory || '');
    this.$set(resources.limits, 'cpu', resources?.limits?.cpu || '');
    this.$set(resources.limits, 'memory', resources?.limits?.memory || '');
  },

  computed: {
    doneLocationOverride() {
      return this.value.listLocation;
    },

    prometheusNodeExporter() {
      return this.value.spec.values['prometheus-node-exporter'];
    }
  },
};
</script>

<template>
  <div>
    <h3>{{ t('harvester.setting.harvesterMonitoring.section.prometheus') }}</h3>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.values.prometheus.prometheusSpec.scrapeInterval"
          :label="t('monitoring.prometheus.config.scrape')"
          :tooltip="t('harvester.setting.harvesterMonitoring.tips.scrape')"
          :required="true"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.values.prometheus.prometheusSpec.evaluationInterval"
          :label="t('monitoring.prometheus.config.evaluation')"
          :tooltip="t('harvester.setting.harvesterMonitoring.tips.evaluation')"
          :required="true"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.values.prometheus.prometheusSpec.retention"
          :label="t('monitoring.prometheus.config.retention')"
          :tooltip="t('harvester.setting.harvesterMonitoring.tips.retention')"
          :required="true"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.values.prometheus.prometheusSpec.retentionSize"
          :label="t('monitoring.prometheus.config.retentionSize')"
          :tooltip="t('harvester.setting.harvesterMonitoring.tips.retentionSize')"
          :required="true"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-12 mt-5">
        <h4 class="mb-0">
          {{ t('monitoring.prometheus.config.resourceLimits') }}
        </h4>
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.values.prometheus.prometheusSpec.resources.requests.cpu"
          :label="t('monitoring.prometheus.config.requests.cpu')"
          :required="true"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.values.prometheus.prometheusSpec.resources.requests.memory"
          :label="t('monitoring.prometheus.config.requests.memory')"
          :required="true"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.values.prometheus.prometheusSpec.resources.limits.cpu"
          :label="t('monitoring.prometheus.config.limits.cpu')"
          :required="true"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.spec.values.prometheus.prometheusSpec.resources.limits.memory"
          :label="t('monitoring.prometheus.config.limits.memory')"
          :required="true"
          :mode="mode"
        />
      </div>
    </div>
    <hr class="divider mt-30 mb-20" />
    <h3>{{ t('harvester.setting.harvesterMonitoring.section.prometheusNodeExporter') }}</h3>
    <div class="row mt-10">
      <div class="col span-6">
        <LabeledInput
          v-model="prometheusNodeExporter.resources.limits.cpu"
          :label="t('monitoring.prometheus.config.limits.cpu')"
          :required="true"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="prometheusNodeExporter.resources.limits.memory"
          :label="t('monitoring.prometheus.config.limits.memory')"
          :required="true"
          :mode="mode"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <LabeledInput
          v-model="prometheusNodeExporter.resources.requests.cpu"
          :label="t('monitoring.prometheus.config.requests.cpu')"
          :required="true"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="prometheusNodeExporter.resources.requests.memory"
          :label="t('monitoring.prometheus.config.requests.memory')"
          :required="true"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
