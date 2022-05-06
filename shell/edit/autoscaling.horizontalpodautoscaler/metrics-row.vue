<script>
import values from 'lodash/values';
import isEmpty from 'lodash/isEmpty';

import ExternalMetric, { DEFAULT_EXTERNAL_METRIC } from '@shell/edit/autoscaling.horizontalpodautoscaler/external-metric';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ObjectMetric, { DEFAULT_OBJECT_METRIC } from '@shell/edit/autoscaling.horizontalpodautoscaler/object-metric';
import PodMetric, { DEFAULT_POD_METRIC } from '@shell/edit/autoscaling.horizontalpodautoscaler/pod-metric';
import ResourceMetric, { DEFAULT_RESOURCE_METRIC } from '@shell/edit/autoscaling.horizontalpodautoscaler/resource-metric';
import Banner from '@shell/components/Banner';

const METRIC_TYPES = {
  external: { label: 'External' },
  object:   { label: 'Object' },
  pod:      { label: 'Pods' },
  resource: { label: 'Resource' },
};

export default {
  components: {
    Banner,
    ExternalMetric,
    ResourceMetric,
    PodMetric,
    ObjectMetric,
    LabeledSelect,
  },

  props: {
    referent: {
      type:    Object,
      default: () => ({}),
    },
    value: {
      type:    Object,
      default: () => ({}),
    },

    mode: {
      type:    String,
      default: 'create',
    },

    metricsAvailable: {
      type:    Boolean,
      default: true,
    },
  },

  data() {
    return {
      metricOptions: values(METRIC_TYPES),
      metricTypes:   METRIC_TYPES,
    };
  },

  computed: {
    isPodMetric() {
      return this.checkSpecType('pod', 'pods');
    },
    isResourceMetric() {
      return this.checkSpecType('resource');
    },
    isObjectMetric() {
      return this.checkSpecType('object');
    },
    isExternalMetric() {
      return this.checkSpecType('external');
    },
    showReferentWarning() {
      const { referent } = this;

      if (!isEmpty(referent)) {
        const containerRequests = referent.spec?.containers?.[0]?.resources?.requests;

        if (containerRequests && !containerRequests[this.value.name]) {
          return false;
        }
      }

      return true;
    }
  },

  watch: {
    'value.type'(neuType, oldType) {
      const { $set } = this;
      let resourceSpec, podSpec, objectSpec, externalSpec;

      switch (neuType) {
      case 'External':
        externalSpec = this.initExternalSpec();

        $set(this.value, 'external', externalSpec);
        break;
      case 'Object':
        objectSpec = this.initObjectSpec();

        $set(this.value, 'object', objectSpec);
        break;
      case 'Pods':
        podSpec = this.initPodsSpec();

        $set(this.value, 'pods', podSpec);
        break;
      case 'Resource':
        resourceSpec = this.initResourceSpec();

        $set(this.value, 'resource', resourceSpec.resource);
        break;
      default:
        break;
      }

      if (oldType === 'Pods') {
        delete this.value.pods;
      } else {
        delete this.value[oldType.toLowerCase()];
      }
    },
  },

  methods: {
    checkSpecType(typeToCheck, specKey) {
      return (
        this.value?.type === this.metricTypes?.[typeToCheck]?.label &&
        !isEmpty(this.value?.[specKey ?? typeToCheck])
      );
    },
    initExternalSpec() {
      return { ...DEFAULT_EXTERNAL_METRIC };
    },
    initObjectSpec() {
      return { ...DEFAULT_OBJECT_METRIC };
    },
    initResourceSpec() {
      return { ...DEFAULT_RESOURCE_METRIC };
    },
    initPodsSpec() {
      return { ...DEFAULT_POD_METRIC };
    },
  },
};
</script>

<template>
  <div class="metric-row">
    <Banner
      v-if="!metricsAvailable"
      :label="t('hpa.warnings.noMetric')"
      color="warning"
    />
    <Banner
      v-if="!isResourceMetric"
      :label="isExternalMetric ? t('hpa.warnings.external') : t('hpa.warnings.custom')"
      color="warning"
    />
    <Banner
      v-if="showReferentWarning"
      :label="t('hpa.warnings.resource')"
      color="warning"
    />
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.type"
          :reduce="(val) => val.label"
          :mode="mode"
          :label="t('hpa.metrics.source')"
          :options="metricOptions"
        />
      </div>
    </div>
    <div v-if="isPodMetric">
      <PodMetric v-model="value.pods" :mode="mode" />
    </div>
    <div v-else-if="isExternalMetric">
      <ExternalMetric v-model="value.external" :mode="mode" />
    </div>
    <div v-else-if="isObjectMetric">
      <ObjectMetric v-model="value.object" :mode="mode" />
    </div>
    <div v-else-if="isResourceMetric">
      <ResourceMetric v-model="value.resource" :mode="mode" />
    </div>
  </div>
</template>
