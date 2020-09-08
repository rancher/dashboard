<script>
import isEmpty from 'lodash/isEmpty';
import merge from 'lodash/merge';

import Alerting from '@/chart/monitoring/alerting';
import Checkbox from '@/components/form/Checkbox';
import ClusterSelector from '@/chart/monitoring/ClusterSelector';
import Grafana from '@/chart/monitoring/grafana';
import Prometheus from '@/chart/monitoring/prometheus';

import { allHash } from '@/utils/promise';
import { STORAGE_CLASS, PVC, SECRET } from '@/config/types';

export default {
  components: {
    Alerting,
    Checkbox,
    ClusterSelector,
    Grafana,
    Prometheus,
  },

  props: {
    chart: {
      type:    Object,
      default: () => ({})
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
      pvcs:                  [],
      secrets:               [],
      storageClasses:        [],
      targetNamespace:       null,
    };
  },

  created() {
    if (this.mode === 'create') {
      const extendedDefaults = {
        global: {
          rbac: {
            userRoles: {
              create:                  true,
              aggregateToDefaultRoles: true,
            },
          },
        },
        prometheus: {
          prometheusSpec: {
            scrapeInterval:     '1m',
            evaluationInterval: '1m',
            retention:          '10d',
            retentionSize:      '50GiB',
            enableAdminAPI:     false,
          },
        },
      };

      merge(this.value, extendedDefaults);
    }
  },

  mounted() {
    this.fetchDeps();
  },

  methods: {
    async fetchDeps() {
      const { $store } = this;
      const hash = await allHash({
        storageClasses: $store.dispatch('cluster/findAll', { type: STORAGE_CLASS }),
        pvcs:           $store.dispatch('cluster/findAll', { type: PVC }),
        secrets:        $store.dispatch('cluster/findAll', { type: SECRET }),
        namespaces:     $store.getters['namespaces'](),
      });

      this.targetNamespace = hash.namespaces[this.chart.targetNamespace] || false;

      if (!isEmpty(hash.storageClasses)) {
        this.storageClasses = hash.storageClasses;
      }

      if (!isEmpty(hash.pvcs)) {
        this.pvcs = hash.pvcs;
      }

      if (!isEmpty(hash.secrets)) {
        this.secrets = hash.secrets;
      }
    },
  },
};
</script>

<template>
  <div class="config-monitoring-container">
    <section class="config-cluster-general">
      <div class="row mb-20">
        <ClusterSelector :value="value" :mode="mode" />
      </div>
      <div class="row">
        <div class="col span-6">
          <Checkbox v-model="value.global.rbac.userRoles.create" :label="t('monitoring.createDefaultRoles')" />
        </div>
        <div class="col span-6">
          <Checkbox v-model="value.global.rbac.userRoles.aggregateToDefaultRoles" :label="t('monitoring.aggregateDefaultRoles')" />
        </div>
      </div>
    </section>
    <section class="config-alerting-container">
      <Alerting
        v-model="value"
        :mode="mode"
        :secrets="secrets"
      />
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
