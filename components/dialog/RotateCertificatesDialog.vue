<script>
import Card from '@/components/Card';
import AsyncButton from '@/components/AsyncButton';
import Banner from '@/components/Banner';

import RadioGroup from '@/components/form/RadioGroup';
import Select from '@/components/form/Select';

import { get, set } from '@/utils/object';
import { exceptionToErrorsArray } from '@/utils/error';

export default {
  components: {
    Select,
    RadioGroup,
    Card,
    AsyncButton,
    Banner
  },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },

  data() {
    return {
      selectedService: '', allServices: true, errors: []
    };
  },

  computed:   {
    cluster() {
      return this.resources?.[0];
    },

    serviceOptions() {
      const schema = this.$store.getters['rancher/schemaFor']('rotatecertificateinput');

      return get(schema, 'resourceFields.services.options') || [];
    },

    actionParams() {
      if (this.allServices) {
        return {
          services:       null,
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
        const isRke2Cluster = !!this.cluster.spec?.rkeConfig;

        if (isRke2Cluster) {
          // The Steve API doesn't support actions, so for RKE2 cluster cert rotation, we patch the cluster.
          const currentGeneration = this.cluster.spec?.rkeConfig?.rotateCertificates?.generation || 0;

          set(this.cluster, 'spec.rkeConfig.rotateCertificates', {
            generation:     currentGeneration + 1,
            caCertificates: true,
            services:       this.selectedService ? [this.selectedService] : null
          });

          await this.cluster.save();
        } else {
          const cluster = this.cluster.mgmt;

          await cluster.doAction('rotateCertificates', params);
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
  <Card class="prompt-rotate" :show-highlight-border="false" :style="{'height':'100%'}">
    <template #title>
      <h3>{{ t('cluster.rotateCertificates.modalTitle') }}</h3>
    </template>
    <template #body>
      <Banner v-for="(error, i) in errors" :key="i" class="" color="error" :label="error" />
      <div class="options">
        <RadioGroup v-model="allServices" name="service-mode" :options="[{value: true,label:t('cluster.rotateCertificates.allServices')}, {value: false, label:t('cluster.rotateCertificates.selectService')}]" />
        <Select v-model="selectedService" :options="serviceOptions" class="service-select" :class="{'invisible': allServices}" />
      </div>
    </template>
    <div slot="actions" class="buttons">
      <button class="btn role-secondary mr-20" @click="close">
        {{ t('generic.cancel') }}
      </button>
      <AsyncButton mode="rotate" :disabled="!allServices && !selectedService" @click="rotate" />
    </div>
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

.rotate-modal ::v-deep.v--modal-box{
  border:none;

  & .card-container{
    margin: 0;

    & .card-wrap {
      display:flex;
      flex-direction:column;
    }

    & .card-body {
      flex: 1;
    }

    & .card-actions{
      align-self: center
    };
  }
}
</style>
