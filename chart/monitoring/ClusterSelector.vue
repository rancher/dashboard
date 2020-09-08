<script>
import isEmpty from 'lodash/isEmpty';
import LabeledSelect from '@/components/form/LabeledSelect';
import { mapGetters } from 'vuex';

const CLUSTER_TYPES = [
  {
    id:       'RKE',
    label:    'monitoring.clusterType.rke',
    provider: 'rke',
  },
  {
    id:       'RKE Federal',
    label:    'monitoring.clusterType.rke2',
    provider: 'rke2',
  },
  {
    id:       'K3s',
    label:    'monitoring.clusterType.k3s',
    provider: 'k3s',
  },
  {
    id:       'KubeADM',
    label:    'monitoring.clusterType.kubeAdmin',
    provider: 'kubeadm',
  },
  {
    id:       'Managed Cluster (EKS, GKE, AKS, etc.)',
    label:    'monitoring.clusterType.managed',
    provider: ['eks', 'gke', 'aks'],
  },
  {
    id:       'Other',
    label:    'monitoring.clusterType.other',
    provider: ['docker', 'minikube'],
  },
];

const CONFIG_KEYS = {
  rke:     ['rkeControllerManager', 'rkeScheduler', 'rkeProxy', 'rkeEtcd'],
  rke2:    ['rke2ControllerManager', 'rke2Scheduler', 'rke2Proxy', 'rke2Etcd'],
  k3s:     ['k3sControllerManager', 'k3sScheduler', 'k3sProxy'],
  kubeadm: [
    'kubeAdmControllerManager',
    'kubeAdmScheduler',
    'kubeAdmProxy',
    'kubeAdmEtcd',
  ],
  managed: [
    'kubeControllerManager',
    'kubeScheduler',
    'kubeEtcd',
    'prometheusOperator.hostNetwork',
  ],
  other: ['kubeControllerManager', 'kubeScheduler', 'kubeEtcd'],
};

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
      clusterTypes: CLUSTER_TYPES,
      configKeys:   CONFIG_KEYS,
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
      let resetOut = [];
      let setNewOut = [];

      // reset old values
      switch (oldClusterType) {
      case 'RKE':
        resetOut = [this.configKeys.rke, false];
        break;
      case 'RKE Federal':
        resetOut = [this.configKeys.rke2, false];
        break;
      case 'K3s':
        resetOut = [this.configKeys.k3s, false];
        break;
      case 'KubeADM':
        resetOut = [this.configKeys.kubeadm, false];
        break;
      case 'Managed Cluster (EKS, GKE, AKS, etc.)':
        resetOut = [this.configKeys.managed, false];
        break;
      case 'Other':
      default:
        resetOut = [this.configKeys.other, false];
        break;
      }

      // set new values
      switch (clusterType) {
      case 'RKE':
        setNewOut = [this.configKeys.rke, true];
        break;
      case 'RKE Federal':
        setNewOut = [this.configKeys.rke2, true];
        break;
      case 'K3s':
        setNewOut = [this.configKeys.k3s, true];
        break;
      case 'KubeADM':
        setNewOut = [this.configKeys.kubeadm, true];
        break;
      case 'Managed Cluster (EKS, GKE, AKS, etc.)':
        setNewOut = [this.configKeys.managed, false];
        this.setClusterTypeEnabledValues(
          ['prometheusOperator.hostNetwork'],
          true
        );
        break;
      case 'Other':
      default:
        setNewOut = [this.configKeys.other, true];
        break;
      }

      this.setClusterTypeEnabledValues(resetOut);
      this.setClusterTypeEnabledValues(setNewOut);
    },
  },

  created() {
    const { provider, clusterTypes } = this;

    const matchedProvder = clusterTypes.find(ct => ct.provider.includes(provider));

    if (isEmpty(matchedProvder)) {
      this.clusterType = 'Other';
    } else {
      this.clusterType = matchedProvder.id;
    }
  },

  methods: {
    setClusterTypeEnabledValues([keyNames = [], valueToSet = null]) {
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
    :label="t('monitoring.clusterType.label')"
    :placeholder="t('monitoring.clusterType.placeholder')"
    :localized-label="true"
    :options="clusterTypes"
    :value="clusterType"
    @input="({id}) => clusterType = id"
  />
</template>
