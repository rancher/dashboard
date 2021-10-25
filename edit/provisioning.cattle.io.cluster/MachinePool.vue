<script>

import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import { _EDIT } from '@/config/query-params';
import { importMachineConfig } from '@/utils/dynamic-importer';
import Taints from '@/components/form/Taints.vue';
import KeyValue from '@/components/form/KeyValue.vue';
import AdvancedSection from '@/components/AdvancedSection.vue';
import Banner from '@/components/Banner';
import { randomStr } from '@/utils/string';

export default {

  components: {
    LabeledInput,
    Checkbox,
    Taints,
    KeyValue,
    AdvancedSection,
    Banner,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    credentialId: {
      type:     String,
      required: true,
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    provider: {
      type:     String,
      required: true,
    },
  },

  data() {
    return { uuid: randomStr() };
  },

  computed: {
    configComponent() {
      const haveProviders = this.$store.getters['plugins/machineDrivers'];

      if ( haveProviders.includes(this.provider) ) {
        return importMachineConfig(this.provider);
      }

      return importMachineConfig('generic');
    }
  },

  methods: {
    async test() {
      if ( typeof this.$refs.configComponent?.test === 'function' ) {
        let errors = [];

        try {
          const res = await this.$refs.configComponent.test();

          if ( !res || res?.errors) {
            if (res?.errors) {
              errors = res.errors;
            }
          }
        } catch (e) {
          errors = [e];
        }

        return errors;
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          v-model="value.pool.name"
          :mode="mode"
          :label="t('cluster.machinePool.name.label')"
          :required="true"
          :disabled="!value.config || !!value.config.id"
        />
      </div>
      <div class="col span-2">
        <LabeledInput
          v-model.number="value.pool.quantity"
          :mode="mode"
          :label="t('cluster.machinePool.quantity.label')"
          type="number"
          min="0"
          :required="true"
        />
      </div>
      <div class="col span-6 pt-5">
        <h3>
          {{ t('cluster.machinePool.role.label') }}
        </h3>
        <Checkbox
          v-model="value.pool.etcdRole"
          :mode="mode"
          label="etcd"
        />
        <Checkbox
          v-model="value.pool.controlPlaneRole"
          :mode="mode"
          label="Control Plane"
        />
        <Checkbox
          v-model="value.pool.workerRole"
          :mode="mode"
          label="Worker"
        />
      </div>
    </div>

    <hr class="mt-10" />

    <component
      :is="configComponent"
      v-if="value.config"
      ref="configComponent"
      :uuid="uuid"
      :mode="mode"
      :value="value.config"
      :provider="provider"
      :credential-id="credentialId"
      @error="e=>errors = e"
    />
    <Banner v-else color="info" label="You do not have access to see this machine pool's configuration." />

    <AdvancedSection :mode="mode" class="advanced">
      <portal-target :name="'advanced-' + uuid" multiple />

      <div class="spacer" />

      <KeyValue
        v-model="value.pool.labels"
        :add-label="t('labels.addLabel')"
        :mode="mode"
        :title="t('cluster.machinePool.labels.label')"
        :read-allowed="false"
        :value-can-be-empty="true"
      />

      <div class="spacer" />

      <Taints v-model="value.pool.taints" :mode="mode" />

      <portal-target :name="'advanced-footer-' + uuid" multiple />
    </AdvancedSection>
  </div>
</template>

<style lang="scss" scoped>
  .advanced ::v-deep >.vue-portal-target:empty,
  .advanced ::v-deep >.vue-portal-target:empty + .spacer {
    display: none;
  }
</style>
