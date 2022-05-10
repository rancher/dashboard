<script>
import isEmpty from 'lodash/isEmpty';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { mapGetters } from 'vuex';
import { findBy } from '@shell/utils/array';
import sortBy from 'lodash/sortBy';

const MANAGED_CONFIG_KEYS = [
  'kubeControllerManager',
  'kubeScheduler',
  'kubeEtcd',
  'kubeProxy',
];

const OTHER_CONFIG_KEYS = [
  'kubeControllerManager',
  'kubeScheduler',
  'kubeEtcd',
  'kubeProxy',
];

const CLUSTER_TYPES = [
  {
    group:      'managed',
    id:         'aks',
    label:      'cluster.provider.azureaks',
    configKeys: MANAGED_CONFIG_KEYS,
  },
  {
    group:      'managed',
    id:         'eks',
    label:      'cluster.provider.amazoneks',
    configKeys: MANAGED_CONFIG_KEYS,
  },
  {
    group:      'managed',
    id:         'gke',
    label:      'cluster.provider.googlegke',
    configKeys: MANAGED_CONFIG_KEYS,
  },
  {
    group:      'k3s',
    id:         'k3s',
    label:      'cluster.provider.k3s',
    configKeys: ['k3sControllerManager', 'k3sScheduler', 'k3sProxy', 'k3sServer'],
  },
  {
    group:      'kubeadm',
    id:         'kubeadm',
    label:      'cluster.provider.kubeAdmin',
    configKeys: [
      'kubeAdmControllerManager',
      'kubeAdmScheduler',
      'kubeAdmProxy',
      'kubeAdmEtcd',
    ],
  },
  {
    group:      'other',
    id:         'other',
    label:      'cluster.provider.other',
    configKeys: OTHER_CONFIG_KEYS,
  },
  {
    group:      'rke',
    id:         'rke',
    label:      'cluster.provider.rke',
    configKeys: ['rkeControllerManager', 'rkeScheduler', 'rkeProxy', 'rkeEtcd'],
  },
  {
    group:      'rke',
    id:         'rke2', // rke federal
    label:      'cluster.provider.rke2',
    configKeys: [
      'rke2ControllerManager',
      'rke2Scheduler',
      'rke2Proxy',
      'rke2Etcd',
    ],
  },
  {
    group:      'rke',
    id:         'rke.windows',
    label:      'cluster.provider.rkeWindows',
    configKeys: ['rkeControllerManager', 'rkeScheduler', 'rkeProxy', 'rkeEtcd'],
  },
];

export default {
  components: { LabeledSelect },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },

  data() {
    return {
      clusterType:  null,
      clusterTypes: sortBy(CLUSTER_TYPES, 'id'),
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    provider() {
      return this.currentCluster.status.provider.toLowerCase();
    },
  },

  watch: {
    // This method is not that dissimilar to persistentStorageType in Grafana config
    // The reason for the divergence is that Grafana has a subkey on the chart
    // where these keys are at the root of the chart. Vue complains about calling
    // this.$set(this, 'value', obj) as we need to do here to reset the values in bulk.
    // So rather than call each set on each line individually I give you this.
    clusterType(clusterType, oldClusterType) {
      if (isEmpty(clusterType)) {
        return;
      }

      if (!isEmpty(oldClusterType)) {
        const { configKeys: oldConfigKeys } = findBy(
          this.clusterTypes,
          'id',
          oldClusterType.id
        );

        if (oldClusterType.group === 'managed') {
          if (oldClusterType.id === 'gke') {
            this.$set(this.value.coreDns, 'enabled', true);
            this.$set(this.value.kubeDns, 'enabled', false);
          }
        } else if (oldClusterType.group !== 'other') { // old cluster type only sets some values to false, if they need to be reset true it will happen below
          this.setClusterTypeEnabledValues([oldConfigKeys, false]);
        }

        if (oldClusterType.group === 'k3s') {
          this.$set(this.value.prometheus.prometheusSpec.resources.limits, 'memory', '1500Mi');
          this.$set(this.value.prometheus.prometheusSpec.resources.requests, 'memory', '750Mi');
        }
      }
      const { configKeys } = findBy(this.clusterTypes, 'id', clusterType.id);

      if (clusterType.group === 'other') {
        this.setClusterTypeEnabledValues([configKeys, false]);
      } else if (clusterType.group === 'managed') {
        this.setClusterTypeEnabledValues([configKeys, false]);

        if (clusterType.id === 'gke') {
          this.$set(this.value.coreDns, 'enabled', false);
          this.$set(this.value.kubeDns, 'enabled', true);
        }
      } else {
        this.setClusterTypeEnabledValues([configKeys, true]);
      }

      if (clusterType.group === 'k3s') {
        this.$set(this.value.prometheus.prometheusSpec.resources.limits, 'memory', '3000Mi');
        this.$set(this.value.prometheus.prometheusSpec.resources.requests, 'memory', '1750Mi');
      }

      if (clusterType.id === 'rke.windows') {
        if (!this.value.global.cattle.windows) {
          this.$set(this.value.global.cattle, 'windows', { enabled: true });
        } else {
          this.value.global.cattle.windows.enabled = true;
        }
      } else if (oldClusterType && oldClusterType.id === 'rke.windows') {
        delete this.value.global.cattle.windows;
      }
      this.$emit('onClusterTypeChanged', clusterType);
    },
  },

  created() {
    const { provider, clusterTypes } = this;
    const matchedProvider = findBy(clusterTypes, 'id', provider);

    if (isEmpty(matchedProvider)) {
      this.clusterType = findBy(this.clusterTypes, 'id', 'other');
    } else {
      this.clusterType = matchedProvider;
    }
  },

  methods: {
    setClusterTypeEnabledValues([keyNames = [], valueToSet = false]) {
      const { value } = this;

      keyNames.forEach((kn) => {
        if (!value[kn]) {
          this.$set(value, kn, {});
        }
        this.$set(value[kn], 'enabled', valueToSet);
      });
    },
  },
};
</script>

<template>
  <LabeledSelect
    v-model="clusterType"
    :label="t('monitoring.clusterType.label')"
    :placeholder="t('monitoring.clusterType.placeholder')"
    :localized-label="true"
    :options="clusterTypes"
  />
</template>
