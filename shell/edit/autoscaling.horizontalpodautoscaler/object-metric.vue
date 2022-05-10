<script>
import MetricTarget from '@shell/edit/autoscaling.horizontalpodautoscaler/metric-target';
import MetricIdentifier from '@shell/edit/autoscaling.horizontalpodautoscaler/metric-identifier';
import MetricObjectReference from '@shell/edit/autoscaling.horizontalpodautoscaler/metric-object-reference';

export const DEFAULT_OBJECT_METRIC = {
  type:   'io.k8s.api.autoscaling.v2beta2.objectmetricsource',
  metric: {
    name:     '',
    selector: {
      matchExpressions: [],
      matchLabels:      {},
    },
  },
  target: {
    type:               'AverageValue',
    averageValue:       '80',
  },
  describedObject: {
    apiVersion: '',
    kind:       '',
    name:       '',
  }
};

export default {
  components: {
    MetricTarget,
    MetricIdentifier,
    MetricObjectReference,
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
      <MetricTarget v-model="value.target" :mode="mode" metric-resource="object" />
    </div>
    <div class="row mb-20">
      <MetricObjectReference v-model="value.describedObject" :mode="mode" />
    </div>
    <div class="row">
      <MetricIdentifier v-model="value.metric" :mode="mode" />
    </div>
  </div>
</template>
