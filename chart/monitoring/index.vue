<script>
import has from 'lodash/has';
import isEmpty from 'lodash/isEmpty';
import jsyaml from 'js-yaml';
import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';

import Alerting from '@/chart/monitoring/alerting';
import Checkbox from '@/components/form/Checkbox';
import ClusterSelector from '@/chart/monitoring/ClusterSelector';
import Grafana from '@/chart/monitoring/grafana';
import Prometheus from '@/chart/monitoring/prometheus';

import { allHash } from '@/utils/promise';
import { base64Encode } from '@/utils/crypto';
import { STORAGE_CLASS, PVC, SECRET, NAMESPACE } from '@/config/types';

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
      newAlertManagerSecret: {},
      pvcs:                  [],
      secrets:               [],
      storageClasses:        [],
      targetNamespace:       null,
    };
  },

  created() {
    this.$emit('register-before-hook', this.createNamespace, 0);
    this.$emit('register-before-hook', this.createDefaultSecret, 1);

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
    async createNamespace(cb) {
      const { value: model, targetNamespace } = this;

      if (model.alertmanager.enabled) {
        if (targetNamespace) {
          return targetNamespace;
        }

        try {
          const nsData = { type: NAMESPACE, metadata: { name: this.chart.targetNamespace } };

          const neuNS = await this.$store.dispatch('cluster/create', nsData);

          await neuNS.save();
          await neuNS.waitForState('active');

          return neuNS;
        } catch (error) {
          console.error(error); // eslint-disable-line no-console
          throw error;
        }
      }
    },

    async createDefaultSecret(cb) {
      const { value: model, newAlertManagerSecret } = this;
      // clone the new secret so we can base64 the content without borking users secret if the save fails
      const cloned = cloneDeep(newAlertManagerSecret);

      if (model.alertmanager.enabled && !model.alertmanager.alertmanagerSpec.useExistingSecret) {
        if (isEmpty(cloned)) {
          throw new Error('An AlertManager secret is required');
        }

        if (!has(cloned?.data, 'alertmanager.yaml')) {
          throw new Error('The AlertManager config must have a key with alertmanager.yaml');
        }

        Object.keys(cloned.data).forEach((keey) => {
          cloned.data[keey] = base64Encode(newAlertManagerSecret.data[keey]);
        });

        try {
          const secret = await this.$store.dispatch('cluster/create', cloned);

          await secret.save();
          await secret.waitForState('active');

          this.newAlertManagerSecret = secret;

          return secret;
        } catch (error) {
          console.error(error); // eslint-disable-line no-console
          throw error;
        }
      }
    },

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

    async initSecret() {
      const { value } = this;
      const defData = {
        apiVersion: 'v1',
        kind:       'Secret',
        type:       SECRET,
        data:       { 'alertmanager.yaml': '' },
        metadata:   {
          labels:    { alertmanager_config: '1' },
          name:      'alertmanager-rancher-monitoring-alertmanager',
          namespace: 'cattle-monitoring-system',
        }
      };

      try {
        defData.data['alertmanager.yaml'] = jsyaml.safeDump(value.alertmanager.config);
      } catch (error) {
        console.error('Unable to parse alertmanager config into yaml! No defaults will be set.', error); // eslint-disable-line no-console
        throw error;
      }

      merge(defData.data, value.alertmanager.templateFiles);

      const secret = await this.$store.dispatch('cluster/create', defData);

      this.newAlertManagerSecret = secret;
    },

    setSecretValues(rows) {
      const { newAlertManagerSecret: secret } = this;

      this.$set(secret, 'data', rows);
    },

    setSecretRowYamlValue(str, row) {
      const { newAlertManagerSecret } = this;
      const rowName = row.key;

      if (!isEmpty(rowName)) {
        this.$set(newAlertManagerSecret.data, rowName, str);
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
        :new-alert-manager-secret="newAlertManagerSecret.data"
        @init-secret="initSecret"
        @set-secret-values="setSecretValues"
        @secret-yaml-update="setSecretRowYamlValue"
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
