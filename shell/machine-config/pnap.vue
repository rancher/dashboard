<script>
import { NORMAN } from '@shell/config/types';
import { exceptionToErrorsArray, stringify } from '@shell/utils/error';
import { _CREATE } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: {
    Loading,
    Banner,
    LabeledSelect,
    LabeledInput,
  },

  mixins: [CreateEditView],

  props: {
    credentialId: {
      type:     String,
      required: true,
    },
    disabled: {
      type:    Boolean,
      default: false,
    },
  },

  async fetch() {
    this.errors = [];

    try {
      if (this.credentialId) {
        this.credential = await this.$store.dispatch('rancher/find', {
          type: NORMAN.CLOUD_CREDENTIAL,
          id:   this.credentialId,
        });
        this.value['clientIdentifier'] = this.credential.decodedData.clientIdentifier;
      }
    } catch (e) {
      this.credential = null;
    }

    try {
      this.allProducts = await this.$store.dispatch('pnap/allProducts', { credentialId: this.credentialId });

      this.osChoices = await this.$store.dispatch('pnap/osChoices', { credentialId: this.credentialId });

      const serverOs = this.osChoices[0].value;

      if (!this.value.serverOs) {
        this.value.serverOs = serverOs;
      }
      if (!this.value.serverLocation) {
        this.value.serverLocation = 'PHX';
      }
      if (!this.value.serverType) {
        this.value.serverType = 's1.c1.medium';
      }
      this.updateInterfaces();
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    return {
      credential:  null,
      allProducts: null,
      osChoices:   null,
    };
  },

  watch: {
    'credentialId'() {
      this.$fetch();
    },
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },
    locationChoices() {
      const products = this.allProducts;
      const result = [];

      if (Array.isArray(products)) {
        const map = new Map();

        for (const prod of products) {
          for (const plan of prod.plans) {
            if (!map.has(plan.location)) {
              map.set(plan.location, true);
              result.push({ value: plan.location, label: plan.location });
            }
          }
        }
      } else {
        result.push({ value: products.message });
      }

      return result;
    },
    typeChoices() {
      const products = this.allProducts;
      const result = [];

      if (Array.isArray(products)) {
        const map = new Map();
        const serverLocation = this.value.serverLocation;

        for (const prod of products) {
          for (const plan of prod.plans) {
            if (
              !map.has(prod.productCode) &&
              plan.location === serverLocation
            ) {
              map.set(prod.productCode, true);
              result.push({
                value: prod.productCode,
                label: `${ prod.productCode } - $${ plan.price }/hour`,
              });
            }
          }
        }
        if (!map.has(this.value.serverType) && products.length > 0) {
          this.preselectFirst(result[0].value);
        }
      } else {
        result.push({ value: products.message });
      }

      return result;
    },
    type() {
      const products = this.allProducts;

      if (Array.isArray(products)) {
        const serverLocation = this.value.serverLocation;
        const serverType = this.value.serverType;

        for (const prod of products) {
          for (const plan of prod.plans) {
            if (prod.productCode === serverType && plan.location === serverLocation) {
              return prod;
            }
          }
        }
      }

      return products.message;
    },
  },

  methods: {
    stringify,

    updateInterfaces() {
      if (!this.value.interfaces) {
        this.value.interfaces = [];
      }
    },

    preselectFirst(val) {
      this.value.serverType = val;
    },
  },
};
</script>

<template>
  <Loading
    v-if="$fetchState.pending"
    :delayed="true"
  />
  <div v-else-if="errors.length">
    <div
      v-for="(err, idx) in errors"
      :key="idx"
    >
      <Banner
        color="error"
        :label="stringify(err)"
      />
    </div>
  </div>
  <div v-else>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.serverLocation"
          :mode="mode"
          :options="locationChoices"
          :searchable="true"
          :required="true"
          :disabled="disabled"
          :label="t('cluster.machineConfig.pnap.serverLocation.label')"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.serverType"
          :mode="mode"
          :options="typeChoices"
          :searchable="true"
          :required="true"
          :disabled="disabled"
          :label="t('cluster.machineConfig.pnap.serverType.label')"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-3">
        <LabeledInput
          v-model:value="type.metadata.cpu"
          :mode="mode"
          :disabled="true"
          :label="t('cluster.machineConfig.pnap.serverCpu.label')"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model:value="type.metadata.coresPerCpu"
          :mode="mode"
          :disabled="true"
          :label="t('cluster.machineConfig.pnap.serverCoresPerCpu.label')"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model:value="type.metadata.cpuCount"
          :mode="mode"
          :disabled="true"
          :label="t('cluster.machineConfig.pnap.serverCpuCount.label')"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model:value="type.metadata.cpuFrequency"
          :mode="mode"
          :disabled="true"
          :label="t('cluster.machineConfig.pnap.serverCpuFrequency.label')"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-3">
        <LabeledInput
          v-model:value="type.metadata.ramInGb"
          :mode="mode"
          :disabled="true"
          :label="t('cluster.machineConfig.pnap.serverRam.label')"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model:value="type.metadata.storage"
          :mode="mode"
          :disabled="true"
          :label="t('cluster.machineConfig.pnap.serverStorage.label')"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model:value="type.metadata.network"
          :mode="mode"
          :disabled="true"
          :label="t('cluster.machineConfig.pnap.serverNetwork.label')"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-model:value="value.serverOs"
          :mode="mode"
          :options="osChoices"
          :searchable="true"
          :required="true"
          :disabled="disabled"
          :label="t('cluster.machineConfig.pnap.serverOs.label')"
        />
      </div>
    </div>
  </div>
</template>
