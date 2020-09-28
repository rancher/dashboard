<script>
import isEmpty from 'lodash/isEmpty';
import LabeledSelect from '@/components/form/LabeledSelect';
import { mapGetters } from 'vuex';
import { findBy } from '@/utils/array';
import sortBy from 'lodash/sortBy';

const MANAGED_CONFIG_KEYS = [
  'kubeControllerManager',
  'kubeScheduler',
  'kubeEtcd',
];

const OTHER_CONFIG_KEYS = ['kubeControllerManager', 'kubeScheduler', 'kubeEtcd'];

const CLUSTER_TYPES = [
  {
    id:         'aks',
    label:      'monitoring.clusterType.aks',
    configKeys: MANAGED_CONFIG_KEYS,
  },
  {
    id:         'eks',
    label:      'monitoring.clusterType.eks',
    configKeys: MANAGED_CONFIG_KEYS,
  },
  {
    id:         'gke',
    label:      'monitoring.clusterType.gke',
    configKeys: MANAGED_CONFIG_KEYS,
  },
  {
    id:         'k3s',
    label:      'monitoring.clusterType.k3s',
    configKeys: ['k3sControllerManager', 'k3sScheduler', 'k3sProxy'],
  },
  {
    id:         'kubeadm',
    label:      'monitoring.clusterType.kubeAdmin',
    configKeys: [
      'kubeAdmControllerManager',
      'kubeAdmScheduler',
      'kubeAdmProxy',
      'kubeAdmEtcd',
    ],
  },
  {
    id:         'other',
    label:      'monitoring.clusterType.other',
    configKeys: OTHER_CONFIG_KEYS,
  },
  {
    id:         'rke',
    label:      'monitoring.clusterType.rke',
    configKeys: ['rkeControllerManager', 'rkeScheduler', 'rkeProxy', 'rkeEtcd'],
  },
  {
    id:         'rke2', // rke federal
    label:      'monitoring.clusterType.rke2',
    configKeys: ['rke2ControllerManager', 'rke2Scheduler', 'rke2Proxy', 'rke2Etcd'],
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
    }
  },

  watch: {
    // This method is not that disimilar to persistentStorageType in Grafan config
    // The reason for the divergence is that Grafna has a subkey on the chart
    // where these keys are at the root of the chart. Vue complains about calling
    // this.$set(this, 'value', obj) as we need to do here to reset the values in bulk.
    // So rather than call each set on each line individually I give you this.
    clusterType(clusterType, oldClusterType) {
      if (isEmpty(clusterType)) {
        return;
      }

      const managedKeys = ['aks', 'gke', 'eks'];

      if (!isEmpty(oldClusterType)) {
        const { configKeys: oldConfigKeys } = findBy(this.clusterTypes, 'id', oldClusterType.id);

        this.setClusterTypeEnabledValues([oldConfigKeys, false]);

        if (managedKeys.includes(oldClusterType.id)) {
          this.$set(this.value['prometheusOperator'], 'hostNetwork', false);
        }
      }

      const { configKeys } = findBy(this.clusterTypes, 'id', clusterType.id);

      this.setClusterTypeEnabledValues([configKeys, true]);

      if (managedKeys.includes(clusterType.id)) {
        this.$set(this.value['prometheusOperator'], 'hostNetwork', true);
      }
    },
  },

  created() {
    const { provider, clusterTypes } = this;
    const matchedProvder = findBy(clusterTypes, 'id', provider);

    if (isEmpty(matchedProvder)) {
      this.clusterType = findBy(this.clusterTypes, 'id', 'other');
    } else {
      this.clusterType = matchedProvder;
    }
  },

  methods: {
    setClusterTypeEnabledValues([keyNames = [], valueToSet = false]) {
      const { value } = this;

      keyNames.forEach((kn) => {
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
