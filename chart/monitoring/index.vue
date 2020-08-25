<script>
import { STORAGE_CLASS, PVC, SECRET, NAMESPACE } from '@/config/types';
import merge from 'lodash/merge';
import jsyaml from 'js-yaml';
import RadioGroup from '@/components/form/RadioGroup';
import ClusterSelector from '@/chart/monitoring/ClusterSelector';
import Prometheus from '@/chart/monitoring/prometheus';
import Grafana from '@/chart/monitoring/grafana';
import Alerting from '@/chart/monitoring/alerting';
import isEmpty from 'lodash/isEmpty';
import has from 'lodash/has';

export default {
  components: {
    Alerting,
    ClusterSelector,
    Grafana,
    Prometheus,
    RadioGroup,
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
      enableDisableLabels: [
        this.t('generic.disabled'),
        this.t('generic.enabled'),
      ],
      newAlertManagerSecret: {},
      pvcs:                  [],
      secrets:               [],
      storageClasses:        [],
      targetNamespace:       null,
    };
  },

  created() {
    [this.createNamespace, this.createDefaultSecret]
      .forEach((fn, idx) => this.$emit('register-before-hook', fn, idx));

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

      if (model.alertmanager.enabled && !model.alertmanager.alertmanagerSpec.useExistingSecret) {
        if (isEmpty(newAlertManagerSecret)) {
          throw new Error('An AlertManager secret is required');
        }

        if (!has(newAlertManagerSecret?.data, 'alertmanager.yaml')) {
          throw new Error('The AlertManager config must have a key with alertmanager.yaml');
        }

        try {
          await newAlertManagerSecret.save();
          await newAlertManagerSecret.waitForState('active');

          return newAlertManagerSecret;
        } catch (error) {
          console.error(error); // eslint-disable-line no-console
          throw error;
        }
      }
    },

    async fetchDeps() {
      const { $store } = this;
      const storageClasses = await $store.dispatch('cluster/findAll', { type: STORAGE_CLASS });
      const pvcs = await $store.dispatch('cluster/findAll', { type: PVC });
      const secrets = await $store.dispatch('cluster/findAll', { type: SECRET });
      const namespaces = await $store.getters['namespaces']();

      this.targetNamespace = namespaces[this.chart.targetNamespace] || false;

      if (storageClasses) {
        this.storageClasses = storageClasses;
      }

      if (pvcs) {
        this.pvcs = pvcs;
      }

      if (secrets) {
        this.secrets = secrets.filter(
          secret => secret?.metadata?.namespace === 'cattle-monitoring-system'
        );
      }
    },

    async initSecret() {
      const { value } = this;
      const defData = {
        type:     SECRET,
        data:     { 'alertmanager.yaml': '' },
        metadata: {
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
