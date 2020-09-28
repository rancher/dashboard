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
    label:      'monitoring.clusterType.aks',
    configKeys: MANAGED_CONFIG_KEYS,
  },
  {
    group:      'managed',
    id:         'eks',
    label:      'monitoring.clusterType.eks',
    configKeys: MANAGED_CONFIG_KEYS,
  },
  {
    group:      'managed',
    id:         'gke',
    label:      'monitoring.clusterType.gke',
    configKeys: MANAGED_CONFIG_KEYS,
  },
  {
    group:      'k3s',
    id:         'k3s',
    label:      'monitoring.clusterType.k3s',
    configKeys: ['k3sControllerManager', 'k3sScheduler', 'k3sProxy'],
  },
  {
    group:      'kubeadm',
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
    group:      'other',
    id:         'other',
    label:      'monitoring.clusterType.other',
    configKeys: OTHER_CONFIG_KEYS,
  },
  {
    group:      'rke',
    id:         'rke',
    label:      'monitoring.clusterType.rke',
    configKeys: ['rkeControllerManager', 'rkeScheduler', 'rkeProxy', 'rkeEtcd'],
  },
  {
    group:      'rke',
    id:         'rke2', // rke federal
    label:      'monitoring.clusterType.rke2',
    configKeys: [
      'rke2ControllerManager',
      'rke2Scheduler',
      'rke2Proxy',
      'rke2Etcd',
    ],
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
    // This method is not that disimilar to persistentStorageType in Grafan config
    // The reason for the divergence is that Grafna has a subkey on the chart
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
            this.$set(this.value['coreDns'], 'enabled', true);
            this.$set(this.value['kubeDns'], 'enabled', false);
          }

          this.$set(this.value['prometheusOperator'], 'hostNetwork', false);
        } else if (oldClusterType.group !== 'other') { // old cluster type only sets some values to false, if they need to be reset true it will happen below
          this.setClusterTypeEnabledValues([oldConfigKeys, false]);
        }
      }

      const { configKeys } = findBy(this.clusterTypes, 'id', clusterType.id);

      if (clusterType.group === 'other') {
        this.setClusterTypeEnabledValues([configKeys, false]);
      } else if (clusterType.group === 'managed') {
        this.setClusterTypeEnabledValues([configKeys, false]);
        this.$set(this.value['prometheusOperator'], 'hostNetwork', true);

        if (clusterType.id === 'gke') {
          this.$set(this.value['coreDns'], 'enabled', false);
          this.$set(this.value['kubeDns'], 'enabled', true);
        }
      } else {
        this.setClusterTypeEnabledValues([configKeys, true]);
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
