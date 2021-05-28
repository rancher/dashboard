<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import Card from '@/components/Card';
import AsyncButton from '@/components/AsyncButton';

import RadioGroup from '@/components/form/RadioGroup';

import { get } from '@/utils/object';
import { mapState } from 'vuex';

export default {
  components: {
    LabeledSelect,
    RadioGroup,
    Card,
    AsyncButton
  },
  data() {
    return {
      selectedService: '', allServices: true, errors: []
    };
  },
  computed:   {
    ...mapState('action-menu', ['showPromptRotate', 'toRotate']),

    serviceOptions() {
      const schema = this.$store.getters['rancher/schemaFor']('rotatecertificateinput');

      return get(schema, 'resourceFields.services.options') || '';
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

  watch:    {
    showPromptRotate(show) {
      if (show) {
        this.$modal.show('rotate-certs');
      } else {
        this.$modal.hide('rotate-certs');
      }
    }
  },
  methods: {
    close() {
      this.$store.commit('action-menu/togglePromptRotate');
    },

    rotate(btnCB) {
      const cluster = this.toRotate.mgmt || {};

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
  <modal class="rotate-modal" name="rotate-certs" @closed="close">
    <Card :style="{'height':'100%'}">
      <template #title>
        <h3>{{ t('cluster.rotateCertificates.modalTitle') }}</h3>
      </template>
      <template #body>
        <div v-for="error in errors" :key="error" class="row mb-20 text-error">
          {{ error }}
        </div>
        <div class="row">
          <div class="col span-6">
            <RadioGroup v-model="allServices" name="service-mode" :options="[{value: true,label:t('cluster.rotateCertificates.allServices')}, {value: false, label:t('cluster.rotateCertificates.selectService')}]" />
          </div>
          <div class="col span-6">
            <LabeledSelect v-if="!allServices" v-model="selectedService" :options="serviceOptions" :label="t('cluster.rotateCertificates.services')" />
          </div>
        </div>
      </template>
      <template #actions>
        <button class="btn role-secondary mr-20" @click="close">
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton @click="rotate" />
      </template>
    </Card>
  </modal>
</template>

<style lang='scss' scoped>
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
