<script>
import isEmpty from 'lodash/isEmpty';
import LabeledSelect from '@/components/form/LabeledSelect';

const CLUSTER_TYPES = [
  {
    id:    'RKE',
    label: 'monitoring.clusterType.rke',
  },
  {
    id:    'K3s',
    label: 'monitoring.clusterType.k3s',
  },
  {
    id:    'KubeADM',
    label: 'monitoring.clusterType.kubeAdmin',
  },
  {
    id:    'Managed Cluster (EKS, GKE, AKS, etc.)',
    label: 'monitoring.clusterType.managed',
  },
  {
    id:    'Other',
    label: 'monitoring.clusterType.other',
  },
];

const CONFIG_KEYS = {
  rke:     ['rkeControllerManager', 'rkeScheduler', 'rkeProxy', 'rkeEtcd'],
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
        resetOut = [this.configKeys.other, false];
        break;
      default:
        break;
      }

      // set new values
      switch (clusterType) {
      case 'RKE':
        setNewOut = [this.configKeys.rke, true];
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
        setNewOut = [this.configKeys.other, true];
        break;
      default:
        break;
      }

      this.setClusterTypeEnabledValues(resetOut);
      this.setClusterTypeEnabledValues(setNewOut);
    },
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
