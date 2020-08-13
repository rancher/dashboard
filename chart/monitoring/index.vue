<script>
import { STORAGE_CLASS, PVC } from '@/config/types';
import merge from 'lodash/merge';
import RadioGroup from '@/components/form/RadioGroup';
import ClusterSelector from './ClusterSelector';
import Prometheus from './prometheus';
import Grafana from './grafana';

export default {
  components: {
    ClusterSelector,
    Grafana,
    Prometheus,
    RadioGroup,
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
      enableDisableLabels: [this.t('generic.disabled'), this.t('generic.enabled')],
      pvcs:                [],
      storageClasses:      [],
    };
  },

  created() {
    if (this.mode === 'create') {
      const extendedDefaults = {
        global: {
          rbac: {
            userRoles: {
              create:                  true,
              aggregateToDefaultRoles: true
            }
          }
        },
        prometheus: {
          prometheusSpec: {
            scrapeInterval:     '1m',
            evaluationInterval: '1m',
            retention:          '10d',
            retentionSize:      '50Gib',
            enableAdminAPI:     false,
          }
        }
      };

      merge(this.value, extendedDefaults);
    }
  },

  mounted() {
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
      <div class="row mb-20">
        <ClusterSelector :value="value" :mode="mode" />
      </div>
      <div class="row">
        <div class="col span-6">
          <RadioGroup
            v-model="value.global.rbac.userRoles.create"
            :label="t('monitoring.createDefaultRoles')"
            :labels="enableDisableLabels"
            :mode="mode"
            :options="[false, true]"
          />
        </div>
        <div class="col span-6">
          <RadioGroup
            v-model="value.global.rbac.userRoles.aggregateToDefaultRoles"
            :label="t('monitoring.aggrigateDefaultRoles')"
            :labels="enableDisableLabels"
            :mode="mode"
            :options="[false, true]"
          />
        </div>
      </div>
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
