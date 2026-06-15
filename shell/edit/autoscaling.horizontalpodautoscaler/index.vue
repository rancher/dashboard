<script lang="ts">
import CreateEditView from '@shell/mixins/create-edit-view';

import CruResource from '@shell/components/CruResource.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect.vue';
import Labels from '@shell/components/form/Labels.vue';
import Loading from '@shell/components/Loading.vue';
import NameNsDescription from '@shell/components/form/NameNsDescription.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tabbed from '@shell/components/Tabbed';
import MetricsRow from '@shell/edit/autoscaling.horizontalpodautoscaler/metrics-row.vue';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped.vue';
import { DEFAULT_RESOURCE_METRIC } from '@shell/edit/autoscaling.horizontalpodautoscaler/resource-metric.vue';
import { Checkbox } from '@components/Form/Checkbox';

import { API_SERVICE, SCALABLE_WORKLOAD_TYPES, WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';
import isEmpty from 'lodash/isEmpty';
import find from 'lodash/find';
import endsWith from 'lodash/endsWith';
import HpaScalingRule from '@shell/edit/autoscaling.horizontalpodautoscaler/hpa-scaling-rule.vue';
import { ResourceLabeledSelectPaginateSettings, ResourceLabeledSelectSettings } from '@shell/types/components/resourceLabeledSelect';
import { PaginationParam, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { LabelSelectPaginationFunctionOptions } from '@shell/components/form/labeled-select-utils/labeled-select.utils';

const RESOURCE_METRICS_API_GROUP = 'metrics.k8s.io';

/**
 * HPA spec.scaleTargetRef
 */
interface OBJECT_REFERENCE {
  apiVersion: string;
  kind: string;
  name: string;
}

type Workload = any;

/**
 * Update to type OBJECT_REFERENCE which can be stored directly as scaleTargetRef
 */
const mapWorkload = (workload: Workload | OBJECT_REFERENCE): OBJECT_REFERENCE => {
  return {
    kind:       workload.kind,
    name:       workload.metadata?.name || workload.name,
    apiVersion: workload.apiVersion,
  };
};

export default {
  name: 'CruHPA',

  emits: ['input'],

  components: {
    HpaScalingRule,
    ArrayListGrouped,
    Checkbox,
    CruResource,
    LabeledInput,
    LabeledSelect,
    ResourceLabeledSelect,
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

  async fetch() {
    await this.loadAPIServices();
  },

  data() {
    const sharedSettings = {
      labelSelectOptions: {
        'get-option-label': (opt: Workload) => opt?.name,
        'option-key':       'name',
      },
    };

    const paginateSettings: ResourceLabeledSelectPaginateSettings = {
      ...sharedSettings,
      updateResources: (resources) => {
        return resources.map(mapWorkload);
      },
      requestSettings: this.pageRequestSettings
    };

    const allSettings: ResourceLabeledSelectSettings = {
      ...sharedSettings,
      updateResources: this.mapWorkloads,
    };

    const scalableWorkloadType = WORKLOAD_KIND_TO_TYPE_MAPPING[this.value?.spec?.scaleTargetRef?.kind] || Object.values(SCALABLE_WORKLOAD_TYPES)[0];

    return {
      defaultResourceMetric: DEFAULT_RESOURCE_METRIC,
      paginateSettings,
      allSettings,
      scalableWorkloadType,
      scalableWorkloadTypes: Object.values(SCALABLE_WORKLOAD_TYPES).map((v) => ({ label: this.t(`typeLabel."${ v }"`, { count: 1 }), value: v })),
    };
  },

  computed: {
    allMetrics() {
      return this.value?.spec?.metrics;
    },
    allServices() {
      return this.$store.getters['cluster/all'](API_SERVICE);
    },
    resourceMetricsAvailable() {
      const { allServices } = this;

      return !isEmpty(
        find(
          allServices,
          (api) => api.name.split('.').length === 4 &&
            endsWith(api.name, RESOURCE_METRICS_API_GROUP)
        )
      );
    },
    selectedTargetRef() {
      return this.value?.spec?.scaleTargetRef;
    },
    hasScaleDownRules: {
      get() {
        return !!this.value.spec.behavior?.scaleDown;
      },
      set(hasScaleDownRules: boolean) {
        if (hasScaleDownRules) {
          if (!this.value.spec.behavior) {
            this.value.spec['behavior'] = {};
          }
          if (!this.value.spec.behavior?.scaleDown) {
            this.value.spec.behavior['scaleDown'] = {};
          }
        } else {
          delete this.value.spec.behavior['scaleDown'];
        }
      }
    },
    hasScaleUpRules: {
      get() {
        return !!this.value.spec.behavior?.scaleUp;
      },
      set(hasScaleUpRules: boolean) {
        if (hasScaleUpRules) {
          if (!this.value.spec.behavior) {
            this.value.spec['behavior'] = {};
          }
          if (!this.value.spec.behavior?.scaleUp) {
            this.value.spec.behavior['scaleUp'] = {};
          }
        } else {
          delete this.value.spec.behavior['scaleUp'];
        }
      }
    },
    /**
     * Unique id that when changes resets the state used to show candidate targets
     */
    targetResetKey() {
      return `${ this.value.metadata.namespace }/${ this.scalableWorkloadType }`;
    }
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
      this.value['spec'] = {
        type:           'io.k8s.api.autoscaling.v1.horizontalpodautoscalerspec',
        minReplicas:    1,
        maxReplicas:    10,
        scaleTargetRef: {
          apiVersion: '',
          kind:       '',
          name:       '',
        },
        metrics: [{ ...this.defaultResourceMetric }]
      };
    },
    async loadAPIServices() {
      await this.$store.dispatch('cluster/findAll', { type: API_SERVICE });
    },

    /**
     * Fn of type @PaginateTypeOverridesFn
     */
    pageRequestSettings(opts: LabelSelectPaginationFunctionOptions): LabelSelectPaginationFunctionOptions {
      const { opts: { filter } } = opts;

      const filters: PaginationParam[] = [
        PaginationParamFilter.createSingleField({
          field: 'metadata.namespace', value: this.value.metadata.namespace, equals: true
        }),
      ];

      if (!!filter) {
        filters.push( PaginationParamFilter.createSingleField({
          field: 'metadata.name', value: filter, equals: true, exact: false
        }));
      }

      return {
        ...opts,
        classify:         false,
        groupByNamespace: false,
        sort:             [{ asc: true, field: 'metadata.name' }],
        filters
      };
    },

    /**
     * Update to type OBJECT_REFERENCE which can be stored directly as scaleTargetRef
     */
    mapWorkload(workload: Workload | OBJECT_REFERENCE): OBJECT_REFERENCE {
      return mapWorkload(workload);
    },

    mapWorkloads(workloads: Workload[]) {
      return workloads
        .filter((w) => w.metadata.namespace === this.value.metadata.namespace)
        .map(mapWorkload);
    }
  },

  watch: {
    targetResetKey() {
      delete this.value.spec.scaleTargetRef;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <form
    v-else
    class="filled-height"
  >
    <CruResource
      :done-route="doneRoute"
      :mode="mode"
      :resource="value"
      :validation-passed="true"
      :errors="errors"
      @error="(e: any) => (errors = e)"
      @finish="save"
      @cancel="done"
    >
      <NameNsDescription
        v-if="!isView"
        :value="value"
        :mode="mode"
      />

      <Tabbed
        :side-tabs="true"
        :use-hash="useTabbedHash"
        :default-tab="defaultTab"
      >
        <Tab
          name="target"
          :label="t('hpa.tabs.target')"
          :weight="10"
        >
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledSelect
                v-model:value="scalableWorkloadType"
                :options="scalableWorkloadTypes"
                :mode="mode"
                :label="t('hpa.workloadTab.targetReferenceType')"
                :required="true"
              />
            </div>
            <div class="col span-6">
              <ResourceLabeledSelect
                :key="targetResetKey"
                v-model:value="value.spec.scaleTargetRef"
                :mode="mode"
                :label="t('hpa.workloadTab.targetReference')"
                :required="true"
                :resource-type="scalableWorkloadType"
                :paginated-resource-settings="paginateSettings"
                :all-resources-settings="allSettings"
              />
            </div>
          </div>
          <div class="row">
            <div class="col span-6">
              <LabeledInput
                v-model:value.number="value.spec.minReplicas"
                :mode="mode"
                :label="t('hpa.workloadTab.min')"
                placeholder="1"
                :required="true"
                type="number"
              />
            </div>
            <div class="col span-6">
              <LabeledInput
                v-model:value.number="value.spec.maxReplicas"
                :mode="mode"
                :label="t('hpa.workloadTab.max')"
                placeholder="1"
                :required="true"
                type="number"
              />
            </div>
          </div>
        </Tab>
        <Tab
          name="metrics"
          :label="t('hpa.tabs.metrics')"
        >
          <ArrayListGrouped
            v-model:value="value.spec.metrics"
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
                <i class="icon icon-x" />
              </button>
              <span v-else />
            </template>
            <template #default="props">
              <MetricsRow
                v-model:value="props.row.value"
                :mode="mode"
                :metrics-available="resourceMetricsAvailable"
                :referent="selectedTargetRef"
                :namespace="value.metadata.namespace"
              />
            </template>
          </ArrayListGrouped>
        </Tab>
        <Tab
          name="behavior"
          :label="t('hpa.tabs.behavior')"
        >
          <div class="col span-12 mb-10">
            <h3>
              {{ t('hpa.scaleDownRules.label') }}
            </h3>
            <div class="row mb-10">
              <Checkbox
                v-model:value="hasScaleDownRules"
                :mode="mode"
                :label="t('hpa.scaleDownRules.enable')"
              />
            </div>
            <HpaScalingRule
              v-if="hasScaleDownRules"
              :value="value"
              type="scaleDown"
              :mode="mode"
              @update:value="$emit('input', $event)"
            />
          </div>
          <div class="col span-12">
            <h3>
              {{ t('hpa.scaleUpRules.label') }}
            </h3>
            <div class="row mb-10">
              <Checkbox
                v-model:value="hasScaleUpRules"
                :mode="mode"
                :label="t('hpa.scaleUpRules.enable')"
              />
            </div>
            <HpaScalingRule
              v-if="hasScaleUpRules"
              :value="value"
              type="scaleUp"
              :mode="mode"
              @update:value="$emit('input', $event)"
            />
          </div>
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
