<script>
import { RcModal } from '@components/RcModal';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';

import { RadioGroup } from '@components/Form/Radio';
import Select from '@shell/components/form/Select';

import { get, set } from '@shell/utils/object';
import { exceptionToErrorsArray } from '@shell/utils/error';

export default {
  emits: ['close'],

  components: {
    Select,
    RadioGroup,
    RcModal,
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
      if (this.cluster.isRke2) {
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

        if ( this.cluster.isK3s ) {
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
          // to be null, while RKE2 requires an empty array.
          services:       this.cluster.isRke2 ? [] : null,
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
        if (this.cluster.isRke2) {
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
  <RcModal :title="t('cluster.rotateCertificates.modalTitle')">
    <Banner
      v-for="(error, i) in errors"
      :key="i"
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
    <template #actions>
      <button
        class="btn role-secondary"
        @click="close"
      >
        {{ t('generic.cancel') }}
      </button>
      <AsyncButton
        mode="rotate"
        :disabled="!rotateAllServices && !selectedService"
        @click="rotate"
      />
    </template>
  </RcModal>
</template>

<style lang='scss' scoped>
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
