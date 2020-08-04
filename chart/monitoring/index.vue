<script>
import { STORAGE_CLASS, PVC } from '@/config/types';
import merge from 'lodash/merge';
import ClusterSelector from './ClusterSelector';
import Prometheus from './prometheus';
import Grafana from './grafana';

export default {
  components: {
    ClusterSelector,
    Prometheus,
    Grafana,
  },
  props: {
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
      storageClasses: [],
      pvcs:           [],
    };
  },

  mounted() {
    if (this.mode === 'create') {
      const defaultPrometheusSpec = {
        scrapeInterval:     '1m',
        evaluationInterval: '1m',
        retention:          '10d',
        retentionSize:      '50Gib',
        enableAdminAPI:     false,
      };

      merge(this.value.prometheus.prometheusSpec, defaultPrometheusSpec);
    }

    this.fetchDeps();
  },

  methods: {
    async fetchDeps() {
      const storageClasses = await this.$store.dispatch('cluster/findAll', { type: STORAGE_CLASS });
      const pvcs = await this.$store.dispatch('cluster/findAll', { type: PVC });

      if (storageClasses) {
        this.storageClasses = storageClasses;
      }
      if (pvcs) {
        this.pvcs = pvcs;
      }
    },
  },
};
</script>

<template>
  <div class="config-monitoring-container">
    <section class="config-cluster-general">
      <ClusterSelector :value="value" :mode="mode" />
    </section>
    <section class="config-prometheus-container">
      <Prometheus
        v-model="value"
        :access-modes="accessModes"
        :mode="mode"
        :storage-classes="storageClasses"
      />
    </section>
    <section class="config-grafana-container">
      <Grafana
        v-model="value"
        :access-modes="accessModes"
        :mode="mode"
        :pvcs="pvcs"
        :storage-classes="storageClasses"
      />
    </section>
  </div>
</template>

<style lang="scss">
.config-monitoring-container {
  > section {
    margin-bottom: 20px;

    .title {
      border-bottom: 1px solid var(--border);
    }
  }
}
</style>
