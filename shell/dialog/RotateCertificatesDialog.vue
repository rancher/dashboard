<script>
import { Card } from '@components/Card';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';

import { RadioGroup } from '@components/Form/Radio';
import Select from '@shell/components/form/Select';

import { get, set } from '@shell/utils/object';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { OPERATION } from '@shell/config/types';

export default {
  emits: ['close'],

  components: {
    Select,
    RadioGroup,
    Card,
    AsyncButton,
    Banner
  },

  props: {
    cluster: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return {
      selectedService:   '',
      rotateAllServices: true,
      errors:            []
    };
  },

  computed: {
    serviceOptions() {
      if (this.cluster.isRke2 || this.cluster.isImportedRke2 || this.cluster.isImportedK3s) {
        const options = [
          'admin',
          'api-server',
          'controller-manager',
          'scheduler',
          'cloud-controller',
          'etcd',
          'auth-proxy',
          'kubelet',
          'kube-proxy'
        ];

        if ( this.cluster.isK3s || this.cluster.isImportedK3s ) {
          options.push('k3s-controller', 'k3s-server');
        } else {
          options.push('rke2-controller', 'rke2-server');
        }

        return options.sort();
      }
      // For RKE1 clusters, Norman provides the list of service options:
      // type RotateCertificateInput struct {
      //   CACertificates bool     `json:"caCertificates,omitempty"`
      //   Services       []string `json:"services,omitempty" norman:"type=enum,options=etcd|kubelet|kube-apiserver|kube-proxy|kube-scheduler|kube-controller-manager"`
      // }
      const schema = this.$store.getters['rancher/schemaFor']('rotatecertificateinput');

      return get(schema, 'resourceFields.services.options') || [];
    },

    actionParams() {
      if (this.rotateAllServices) {
        return {
          // To rotate all services, RKE1 clusters need services
          // to be null, while RKE2 and imported RKE2/K3s require an empty array.
          services:       (this.cluster.isRke2 || this.cluster.isImportedRke2 || this.cluster.isImportedK3s) ? [] : null,
          caCertificates: false,
        };
      } else {
        return {
          services:       this.selectedService,
          caCertificates: false,
        };
      }
    }
  },

  mounted() {
    this.selectedService = this.serviceOptions[0] || '';
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async rotate(buttonDone) {
      const params = this.actionParams;

      try {
        if (this.cluster.isImportedWithDayTwoOps) {
          // For imported clusters with day 2 ops, create a cert rotation operation CR
          const namespace = this.cluster.mgmt?.metadata?.namespace || this.cluster.mgmt?.id;
          const resource = await this.$store.dispatch('management/create', {
            type:     OPERATION.CERT_ROTATE,
            metadata: { namespace },
            spec:     {
              clusterRef: {
                apiVersion: 'management.cattle.io/v3',
                kind:       'Cluster',
                name:       this.cluster.mgmt?.id,
              },
              services: (this.selectedService && !this.rotateAllServices) ? [this.selectedService] : [],
            },
          }, { root: true });

          await resource.save();
        } else if (this.cluster.isRke2) {
        // The Steve API doesn't support actions, so for RKE2 cluster cert rotation, we patch the cluster.
          const currentGeneration = this.cluster.spec?.rkeConfig?.rotateCertificates?.generation || 0;

          set(this.cluster, 'spec.rkeConfig.rotateCertificates', {
            generation: currentGeneration + 1,
            services:   (this.selectedService && !this.rotateAllServices) ? [this.selectedService] : []
          });

          await this.cluster.save();
        } else {
          await this.cluster.mgmt.doAction('rotateCertificates', params);
        }
        buttonDone(true);
        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        buttonDone(false);
      }
    }
  }
};
</script>

<template>
  <Card
    class="prompt-rotate"
    :show-highlight-border="false"
    :style="{'height':'100%'}"
  >
    <template #title>
      <h3>{{ t('cluster.rotateCertificates.modalTitle') }}</h3>
    </template>
    <template #body>
      <Banner
        v-for="(error, i) in errors"
        :key="i"
        class=""
        color="error"
        :label="error"
      />
      <div class="options">
        <RadioGroup
          v-model:value="rotateAllServices"
          name="service-mode"
          :options="[
            {
              value: true,
              label:t('cluster.rotateCertificates.allServices')
            },
            {
              value: false,
              label:t('cluster.rotateCertificates.selectService')
            }
          ]"
        />
        <Select
          v-model:value="selectedService"
          :options="serviceOptions"
          class="service-select"
          :class="{'invisible': rotateAllServices}"
        />
      </div>
    </template>
    <template #actions>
      <div class="buttons">
        <button
          class="btn role-secondary mr-20"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          mode="rotate"
          :disabled="!rotateAllServices && !selectedService"
          @click="rotate"
        />
      </div>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .prompt-rotate {
    margin: 0;
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
  .options {
    display: flex;
    flex-direction: column;

    .service-select {
      margin-left: 20px;
      margin-top: 10px;
      width: fit-content;
      min-width: 260px;
    }
  }
</style>
