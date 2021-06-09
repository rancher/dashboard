<script>
import Card from '@/components/Card';
import AsyncButton from '@/components/AsyncButton';

import RadioGroup from '@/components/form/RadioGroup';
import Select from '@/components/form/Select';

import { get } from '@/utils/object';

export default {
  components: {
    Select,
    RadioGroup,
    Card,
    AsyncButton
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

  methods: {
    close() {
      this.$emit('close');
    },

    rotate(btnCB) {
      const cluster = this.cluster.mgmt || {};

      if (!cluster?.actions?.rotateCertificates) {
        btnCB(false);
      } else {
        const params = this.actionParams;

        cluster.doAction('rotateCertificates', cluster, { params }).then((res) => {
          if (res._status === 200) {
            btnCB(true);
            this.errors = [];
            this.close();
          } else {
            this.errors.push(res._statusText);
            btnCB(false);
          }
        });
      }
    },
  }
};
</script>

<template>
  <Card class="prompt-rotate" :show-highlight-border="false" :style="{'height':'100%'}">
    <template #title>
      <h3>{{ t('cluster.rotateCertificates.modalTitle') }}</h3>
    </template>
    <template #body>
      <div v-for="error in errors" :key="error" class="row mb-20 text-error">
        {{ error }}
      </div>
      <div class="options">
        <RadioGroup v-model="allServices" name="service-mode" :options="[{value: true,label:t('cluster.rotateCertificates.allServices')}, {value: false, label:t('cluster.rotateCertificates.selectService')}]" />
        <Select v-model="selectedService" :options="serviceOptions" class="service-select" :class="{'invisible': allServices}" />
      </div>
    </template>
    <div slot="actions" class="buttons">
      <button class="btn role-secondary mr-20" @click="close">
        {{ t('generic.cancel') }}
      </button>
      <AsyncButton mode="rotate" @click="rotate" />
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
