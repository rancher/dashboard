<script>
import MetricTarget from '@shell/edit/autoscaling.horizontalpodautoscaler/metric-target';
import MetricIdentifier from '@shell/edit/autoscaling.horizontalpodautoscaler/metric-identifier';

export const DEFAULT_EXTERNAL_METRIC = {
  type:   'io.k8s.api.autoscaling.v2beta2.externalmetricsource',
  metric: {
    name:     '',
    selector: {
      matchExpressions: [],
      matchLabels:      {},
    },
  },
  target: {
    type:         'AverageValue',
    averageValue: '80',
  },
};

export default {
  components: {
    MetricTarget,
    MetricIdentifier,
  },
  props: {
    value: {
      type:    Object,
      default: () => ({
        name:   '',
        target: {},
      }),
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <MetricTarget
        v-model:value="value.target"
        :mode="mode"
        metric-resource="external"
      />
    </div>
    <div class="row">
      <MetricIdentifier
        v-model:value="value.metric"
        :mode="mode"
      />
    </div>
  </div>
</template>
