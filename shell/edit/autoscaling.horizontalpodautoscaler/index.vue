<script>
import CreateEditView from '@shell/mixins/create-edit-view';

import CruResource from '@shell/components/CruResource';
import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Labels from '@shell/components/form/Labels';
import Loading from '@shell/components/Loading';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import MetricsRow from '@shell/edit/autoscaling.horizontalpodautoscaler/metrics-row';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { DEFAULT_RESOURCE_METRIC } from '@shell/edit/autoscaling.horizontalpodautoscaler/resource-metric';

import { API_SERVICE, SCALABLE_WORKLOAD_TYPES } from '@shell/config/types';
import isEmpty from 'lodash/isEmpty';
import find from 'lodash/find';
import endsWith from 'lodash/endsWith';
import { findBy } from '@shell/utils/array';

const RESOURCE_METRICS_API_GROUP = 'metrics.k8s.io';

export default {
  name: 'CruHPA',

  components: {
    ArrayListGrouped,
    CruResource,
    LabeledInput,
    LabeledSelect,
    Labels,
    Loading,
    NameNsDescription,
    MetricsRow,
    Tab,
    Tabbed,
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },
  },

  fetch() {
    const promises = [this.loadAPIServices(), this.loadWorkloads()];

    return Promise.all(promises);
  },

  data() {
    return { defaultResourceMetric: DEFAULT_RESOURCE_METRIC };
  },

  computed: {
    allMetrics() {
      return this.value?.spec?.metrics;
    },
    allWorkloadsFiltered() {
      return (
        Object.values(SCALABLE_WORKLOAD_TYPES)
          .flatMap(type => this.$store.getters['cluster/all'](type))
          .filter(
            wl => wl.metadata.namespace === this.value.metadata.namespace
          )
      );
    },
    allWorkloadsMapped() {
      return this.allWorkloadsFiltered
      // Update to type OBJECT_REFERENCE which can be stored directly as scaleTargetRef
        .map(workload => ({
          kind:       workload.kind,
          name:       workload.metadata.name,
          apiVersion: workload.apiVersion,
        }));
    },
    allServices() {
      return this.$store.getters['cluster/all'](API_SERVICE);
    },
    resourceMetricsAvailable() {
      const { allServices } = this;

      return !isEmpty(
        find(
          allServices,
          api => api.name.split('.').length === 4 &&
            endsWith(api.name, RESOURCE_METRICS_API_GROUP)
        )
      );
    },
    selectedTargetRef() {
      const { scaleTargetRef: { name } } = this.value.spec;
      const { allWorkloadsFiltered } = this;
      const match = findBy(allWorkloadsFiltered, 'metadata.name', name);

      return match ?? null;
    },
  },

  created() {
    if (!this?.value?.spec?.type) {
      if (!this.value?.spec) {
        this.initSpec();
      }
    }
  },

  methods: {
    initSpec() {
      this.$set(this.value, 'spec', {
        type:           'io.k8s.api.autoscaling.v1.horizontalpodautoscalerspec',
        minReplicas:    1,
        maxReplicas:    10,
        scaleTargetRef: {
          apiVersion: '',
          kind:       '',
          name:       '',
        },
        metrics: [{ ...this.defaultResourceMetric }],
      });
    },
    async loadWorkloads() {
      await Promise.all(
        Object.values(SCALABLE_WORKLOAD_TYPES).map(type => this.$store.dispatch('cluster/findAll', { type })
        )
      );
    },
    async loadAPIServices() {
      await this.$store.dispatch('cluster/findAll', { type: API_SERVICE });
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <form v-else class="filled-height">
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :validation-passed="true"
      :errors="errors"
      @error="(e) => (errors = e)"
      @finish="save"
      @cancel="done"
    >
      <NameNsDescription v-if="!isView" :value="value" :mode="mode" />

      <Tabbed :side-tabs="true">
        <Tab name="target" :label="t('hpa.tabs.target')" :weight="10">
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledSelect
                v-model="value.spec.scaleTargetRef"
                :get-option-label="(opt) => opt.name"
                :mode="mode"
                :label="t('hpa.workloadTab.targetReference')"
                :options="allWorkloadsMapped"
                :required="true"
              >
                <template v-slot:option="option">
                  {{ option.name }}<span class="pull-right">{{ option.kind }}</span>
                </template>
              </LabeledSelect>
            </div>
          </div>
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-model.number="value.spec.minReplicas"
                :mode="mode"
                :label="t('hpa.workloadTab.min')"
                placeholder="1"
                :required="true"
                type="number"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model.number="value.spec.maxReplicas"
                :mode="mode"
                :label="t('hpa.workloadTab.max')"
                placeholder="1"
                :required="true"
                type="number"
              />
            </div>
          </div>
        </Tab>
        <Tab name="metrics" :label="t('hpa.tabs.metrics')">
          <ArrayListGrouped
            v-model="value.spec.metrics"
            :default-add-value="{ ...defaultResourceMetric }"
            :mode="mode"
            :initial-empty-row="true"
          >
            <template #remove-button="removeProps">
              <button
                v-if="value.spec.metrics.length > 1"
                type="button"
                class="btn role-link close btn-sm"
                @click="removeProps.remove"
              >
                <i class="icon icon-2x icon-x" />
              </button>
              <span v-else></span>
            </template>
            <template #default="props">
              <MetricsRow
                v-model="props.row.value"
                :mode="mode"
                :metrics-available="resourceMetricsAvailable"
                :referent="selectedTargetRef"
              />
            </template>
          </ArrayListGrouped>
        </Tab>
        <Tab
          name="labels-and-annotations"
          :label="t('hpa.tabs.labels')"
          :weight="-1"
        >
          <Labels
            :default-container-class="'labels-and-annotations-container'"
            :value="value"
            :mode="mode"
            :display-side-by-side="false"
          />
        </Tab>
      </Tabbed>
    </CruResource>
  </form>
</template>
