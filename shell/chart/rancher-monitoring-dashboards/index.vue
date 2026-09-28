<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import sortBy from 'lodash/sortBy';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { findBy } from '@shell/utils/array';

// Survives Form → YAML → Form tab switches (which unmount/remount this
// component) because the module is loaded once. Keyed by chart name so a
// different chart's install doesn't restore a stale selection.
const cachedSelections = new Map();

const CLUSTER_TYPES = [
  {
    group: 'managed',
    id:    'aks',
    label: 'cluster.provider.azureaks',
  },
  {
    group: 'managed',
    id:    'eks',
    label: 'cluster.provider.amazoneks',
  },
  {
    group: 'managed',
    id:    'gke',
    label: 'cluster.provider.googlegke',
  },
  {
    group: 'k3s',
    id:    'k3s',
    label: 'cluster.provider.k3s',
  },
  {
    group: 'kubeadm',
    id:    'kubeadm',
    label: 'cluster.provider.kubeAdmin',
  },
  {
    group: 'other',
    id:    'other',
    label: 'cluster.provider.other',
  },
  {
    group: 'rke',
    id:    'rke2',
    label: 'cluster.provider.rke2',
  },
];

export default {
  emits: ['input'],

  components: { LabeledSelect },

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
      default: () => ({}),
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
    cacheKey() {
      return this.chart?.chartName || this.chart?.name || '__default__';
    },
  },

  watch: {
    clusterType(clusterType) {
      if (isEmpty(clusterType)) {
        return;
      }

      cachedSelections.set(this.cacheKey, clusterType.id);
      this.applyClusterTypeValues(clusterType);
    },
  },

  created() {
    const cachedId = cachedSelections.get(this.cacheKey);
    const cached = cachedId ? findBy(this.clusterTypes, 'id', cachedId) : null;

    if (cached) {
      this.clusterType = cached;

      return;
    }

    const matched = findBy(this.clusterTypes, 'id', this.provider);

    this.clusterType = matched || findBy(this.clusterTypes, 'id', 'other');
  },

  methods: {
    applyClusterTypeValues(clusterType) {
      const isK3s = clusterType.group === 'k3s';

      if (!this.value.etcd) {
        this.value.etcd = {};
      }
      if (!this.value.k3sServer) {
        this.value.k3sServer = {};
      }

      this.value.etcd.enabled = !isK3s;
      this.value.k3sServer.enabled = isK3s;
    },
  },
};
</script>

<template>
  <div class="config-monitoring-dashboards-container">
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="clusterType"
          :label="t('monitoring.clusterType.label')"
          :placeholder="t('monitoring.clusterType.placeholder')"
          :localized-label="true"
          :options="clusterTypes"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.config-monitoring-dashboards-container {
  padding: 10px 0;
}
</style>
