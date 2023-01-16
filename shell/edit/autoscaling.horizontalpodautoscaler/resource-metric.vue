<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import MetricTarget from '@shell/edit/autoscaling.horizontalpodautoscaler/metric-target';

export const DEFAULT_RESOURCE_METRIC = {
  type:     'Resource',
  resource: {
    name:   'cpu',
    target: {
      type:               'Utilization',
      averageUtilization: 80,
    },
  },
};

export default {
  components: { LabeledSelect, MetricTarget },
  props:      {
    value: {
      type:    Object,
      default: () => ({
        name:   '',
        target: {}
      }),
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },

  data() {
    return {
      resourceTypes: [
        { label: this.t('hpa.types.cpu'), value: 'cpu' },
        { label: this.t('hpa.types.memory'), value: 'memory' },
      ],
    };
  },
};
</script>

<template>
  <div class="resource-metric">
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.name"
          :mode="mode"
          :label="t('hpa.metrics.headers.resource')"
          :options="resourceTypes"
        />
      </div>
    </div>
    <div class="row">
      <MetricTarget
        v-model="value.target"
        :mode="mode"
        metric-resource="resource"
        :resource-name="value.name"
      />
    </div>
  </div>
</template>
