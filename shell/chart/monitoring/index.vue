<script>
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';

import { mapGetters } from 'vuex';

import Alerting from '@shell/chart/monitoring/alerting';
import { Checkbox } from '@components/Form/Checkbox';
import ClusterSelector from '@shell/chart/monitoring/ClusterSelector';
import Grafana from '@shell/chart/monitoring/grafana';
import { LabeledInput } from '@components/Form/LabeledInput';
import Loading from '@shell/components/Loading';
import Prometheus from '@shell/chart/monitoring/prometheus';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';

import { allHash } from '@shell/utils/promise';
import { STORAGE_CLASS, PVC, SECRET, WORKLOAD_TYPES } from '@shell/config/types';
import { CATTLE_MONITORING_NAMESPACE } from '@shell/utils/monitoring';

export default {
  emits: ['register-before-hook', 'input'],

  components: {
    Alerting,
    Checkbox,
    ClusterSelector,
    Grafana,
    LabeledInput,
    Loading,
    Prometheus,
    Tab,
    Tabbed
  },

  props: {
    chart: {
      type:    Object,
      default: () => ({}),
    },

    mode: {
      type:    String,
      default: 'create',
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },

  async fetch() {
    const { $store } = this;

    // Fetch all the resources required for all the tabs asyncronously up front
    const hashPromises = {
      namespaces:        $store.getters['namespaces'](),
      pvcs:              $store.dispatch('cluster/findAll', { type: PVC }),
      // Used in Alerting tab
      monitoringSecrets: $store.dispatch('cluster/findAll', {
        type: SECRET,
        opt:  { namespaced: CATTLE_MONITORING_NAMESPACE }
      }),
      storageClasses: $store.dispatch('cluster/findAll', { type: STORAGE_CLASS }),
    };

    // Are we editing an existing chart?
    // (ported from shell/chart/monitoring/prometheus/index.vue)
    const { existing = false } = this.$attrs;

    // If needed, fetch all the workloads that have prometheus operator like containers
    this.workloadTypes = !existing ? Object.values(WORKLOAD_TYPES) : [];

    this.workloadTypes.forEach((type) => {
      // We'll use a filter to fetch the results. Atm there's no neat way to differentiate between ALL results and JUST filtered
      // So to avoid calls to all getting these filtered (and vice-versa) forget type before and after
      $store.dispatch('cluster/forgetType', type);
      hashPromises[type] = $store.dispatch('cluster/findAll', {
        type,
        opt: {
          watch:  false,
          // We're only interested in images with operator like names (note: these will match partial strings)
          filter: { 'spec.template.spec.containers.image': ['quay.io/coreos/prometheus-operator', 'rancher/coreos-prometheus-operator'] }
        }
      });
    });

    const hash = await allHash(hashPromises);

    this.targetNamespace = hash.namespaces[this.chart.targetNamespace] || false;

    if (!isEmpty(hash.storageClasses)) {
      this.storageClasses = hash.storageClasses;
    }

    if (!isEmpty(hash.pvcs)) {
      this.pvcs = hash.pvcs;
    }

    if (!isEmpty(hash.monitoringSecrets)) {
      this.monitoringSecrets = hash.monitoringSecrets;
    }

    this.workloadTypes.forEach((type) => {
      if (hash[type]) {
        this.filteredWorkloads.push(...hash[type]);
      }
    });
  },

  beforeUnmount() {
    this.workloadTypes.forEach((type) => {
      this.$store.dispatch('cluster/forgetType', type);
    });
  },

  data() {
    return {
      accessModes: [
        {
          id:    'ReadWriteOnce',
          label: 'monitoring.accessModes.once',
        },
        {
          id:    'ReadOnlyMany',
          label: 'monitoring.accessModes.readOnlyMany',
        },
        {
          id:    'ReadWriteMany',
          label: 'monitoring.accessModes.many',
        },
      ],
      clusterType:           {},
      disableAggregateRoles: false,
      prometheusResources:   [],
      pvcs:                  [],
      monitoringSecrets:     [],
      storageClasses:        [],
      targetNamespace:       null,
      filteredWorkloads:     [],
      workloadTypes:         []
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    provider() {
      return this.currentCluster.status.provider.toLowerCase();
    },
  },

  watch: {
    'value.global.rbac.userRoles.create'(createUserRoles) {
      if (createUserRoles) {
        this.disableAggregateRoles = false;
      } else {
        this.value.global.rbac.userRoles.aggregateToDefaultRoles = false;
        this.disableAggregateRoles = true;
      }
    },
  },

  created() {
    if (this.mode === 'create') {
      // merge here doesn't work (existing values are lost when going from form to yaml and back again) so instead supply some better default values
      // any changes here need to respect the order of properties (reflected in the yaml diff)
      const extendedDefaults = {
        global: {
          rbac: {
            userRoles: {
              create:                  this.mergeValue(this.value?.global?.rbac?.userRoles?.create, true),
              aggregateToDefaultRoles: this.mergeValue(this.value?.global?.rbac?.userRoles?.aggregateToDefaultRoles, true),
            },
          },
        },
        prometheus: {
          prometheusSpec: {
            scrapeInterval:     this.mergeValue(this.value?.prometheus?.prometheusSpec?.scrapeInterval, '1m'),
            evaluationInterval: this.mergeValue(this.value?.prometheus?.prometheusSpec?.evaluationInterval, '1m'),
            retention:          this.mergeValue(this.value?.prometheus?.prometheusSpec?.retention, '10d'),
            retentionSize:      this.mergeValue(this.value?.prometheus?.prometheusSpec?.retentionSize, '50GiB'),
            enableAdminAPI:     this.mergeValue(this.value?.prometheus?.prometheusSpec?.enableAdminAPI, false),
          },
        },
      };

      merge(this.value, extendedDefaults);

      if (this.provider.startsWith('rke2')) {
        this.value.rke2IngressNginx['enabled'] = true;
        this.value.rke2Etcd['enabled'] = true;
        this.value.rkeEtcd['enabled'] = false;
      } else if (this.provider.startsWith('rke')) {
        this.value['ingressNginx'] = this.value.ingressNginx || {};
        this.value.ingressNginx['enabled'] = true;
      } else {
        this.value.rkeEtcd['enabled'] = false;
      }
    }

    this.$emit('register-before-hook', this.willSave, 'willSave');
  },

  methods: {
    willSave() {
      const { prometheusSpec } = this.value.prometheus;
      const selector =
        prometheusSpec?.storageSpec?.volumeClaimTemplate?.spec?.selector;

      // This works for UI editor installation
      // However, it doesn't work for yaml editor installation
      // Global values later merged again in charts/install.vue addGlobalValuesTo()
      // We still need to remove the global values from charts/install.vue addGlobalValuesTo()
      if (
        selector &&
        isEmpty(selector.matchExpressions) &&
        isEmpty(selector.matchLabels)
      ) {
        delete this.value.prometheus.prometheusSpec.storageSpec
          .volumeClaimTemplate.spec.selector;
      }
    },

    mergeValue(value, defaultValue) {
      return value === undefined || (typeof value === 'string' && !value.length) ? defaultValue : value;
    },

    onTabChanged() {
      window.scrollTop = 0;
    }
  },
};
</script>

<template>
  <Loading
    v-if="$fetchState.pending"
    mode="relative"
  />
  <div
    v-else
    class="config-monitoring-container"
  >
    <Tabbed
      :side-tabs="true"
      :hide-single-tab="true"
      class="step__values__content with-name"
      @changed="onTabChanged"
    >
      <Tab
        name="general"
        :label="t('monitoring.tabs.general')"
        :weight="99"
      >
        <div>
          <div class="row mb-20">
            <div class="col span-6">
              <ClusterSelector
                :value="value"
                :mode="mode"
                @onClusterTypeChanged="clusterType = $event"
              />
            </div>
          </div>
          <div
            v-if="clusterType.group === 'managed'"
            class="row mb-20"
          >
            <Checkbox
              v-model:value="value.prometheusOperator.hostNetwork"
              label-key="monitoring.hostNetwork.label"
              :tooltip="t('monitoring.hostNetwork.tip', {}, true)"
            />
          </div>
          <div class="row">
            <div class="col span-6">
              <Checkbox
                v-model:value="value.global.rbac.userRoles.create"
                label-key="monitoring.createDefaultRoles.label"
                :tooltip="t('monitoring.createDefaultRoles.tip', {}, true)"
              />
            </div>
            <div class="col span-6">
              <Checkbox
                v-model:value="value.global.rbac.userRoles.aggregateToDefaultRoles"
                label-key="monitoring.aggregateDefaultRoles.label"
                :tooltip="{
                  content: t('monitoring.aggregateDefaultRoles.tip', {}, true),
                  autoHide: false,
                }"
                :disabled="disableAggregateRoles"
              />
            </div>
          </div>
          <div
            v-if="provider === 'rke' && value.rkeEtcd"
            class="row mt-20"
          >
            <div class="col span-6">
              <LabeledInput
                v-model:value="value.rkeEtcd.clients.https.certDir"
                :label="t('monitoring.etcdNodeDirectory.label')"
                :tooltip="t('monitoring.etcdNodeDirectory.tooltip', {}, true)"
                :hover-tooltip="true"
                :mode="mode"
              />
            </div>
          </div>
        </div>
      </Tab>
      <Tab
        name="prometheus"
        :label="t('monitoring.tabs.prometheus')"
        :weight="98"
      >
        <div>
          <Prometheus
            :value="value"
            v-bind="$attrs"
            :access-modes="accessModes"
            :mode="mode"
            :storage-classes="storageClasses"
            :prometheus-pods="prometheusResources"
            :filteredWorkloads="filteredWorkloads"
            @update:value="$emit('input', $event)"
          />
        </div>
      </Tab>
      <Tab
        name="alerting"
        :label="t('monitoring.tabs.alerting')"
        :weight="97"
      >
        <div>
          <Alerting
            :value="value"
            :mode="mode"
            :monitoringSecrets="monitoringSecrets"
            @update:value="$emit('input', $event)"
          />
        </div>
      </Tab>
      <Tab
        name="grafana"
        :label="t('monitoring.tabs.grafana')"
        :weight="96"
      >
        <div>
          <Grafana
            :value="value"
            :access-modes="accessModes"
            :mode="mode"
            :pvcs="pvcs"
            :storage-classes="storageClasses"
            @update:value="$emit('input', $event)"
          />
        </div>
      </Tab>
    </Tabbed>
  </div>
</template>
