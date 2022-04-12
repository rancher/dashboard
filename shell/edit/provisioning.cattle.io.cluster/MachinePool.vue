<script>

import LabeledInput from '@shell/components/form/LabeledInput';
import Checkbox from '@shell/components/form/Checkbox';
import { _EDIT } from '@shell/config/query-params';
import { importMachineConfig } from '@shell/utils/dynamic-importer';
import Taints from '@shell/components/form/Taints.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import AdvancedSection from '@shell/components/AdvancedSection.vue';
import Banner from '@shell/components/Banner';
import UnitInput from '@shell/components/form/UnitInput.vue';
import { randomStr } from '@shell/utils/string';

export default {

  name: 'MachinePool',

  components: {
    LabeledInput,
    Checkbox,
    Taints,
    KeyValue,
    AdvancedSection,
    Banner,
    UnitInput
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
    const parseDuration = (duration) => {
      // The back end stores the timeout in Duration format, for example, "10m".
      // Here we convert that string to an integer.
      const numberString = duration.split('m')[0];

      return parseInt(numberString, 10);
    };

    return {
      uuid: randomStr(),

      unhealthyNodeTimeoutInteger: this.value.pool.unhealthyNodeTimeout ? parseDuration(this.value.pool.unhealthyNodeTimeout) : 0
    };
  },

  computed: {
    configComponent() {
      const haveProviders = this.$store.getters['plugins/machineDrivers'];

      if ( haveProviders.includes(this.provider) ) {
        return importMachineConfig(this.provider);
      }

      return importMachineConfig('generic');
    },

    isWindows() {
      return this.value?.config?.os === 'windows';
    }

  },

  watch: {
    isWindows(neu) {
      if (neu) {
        this.value.pool.etcdRole = false;
        this.value.pool.controlPlaneRole = false;
        this.value.pool.machineOS = 'windows';
      } else {
        this.value.pool.machineOS = 'linux';
      }
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
      <div class="col span-4">
        <LabeledInput
          v-model.number="value.pool.quantity"
          :mode="mode"
          :label="t('cluster.machinePool.quantity.label')"
          type="number"
          min="0"
          :required="true"
        />
      </div>
      <div class="col span-4 pt-5">
        <h3>
          {{ t('cluster.machinePool.role.label') }}
        </h3>
        <Checkbox
          v-model="value.pool.etcdRole"
          :mode="mode"
          label="etcd"
          :disabled="isWindows"
        />
        <Checkbox
          v-model="value.pool.controlPlaneRole"
          :mode="mode"
          label="Control Plane"
          :disabled="isWindows"
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
      <div class="row">
        <div class="col span-4">
          <h3>
            {{ t('cluster.machinePool.autoReplace.label') }}
            <i v-tooltip="t('cluster.machinePool.autoReplace.toolTip')" class="icon icon-info icon-lg" />
          </h3>
          <UnitInput
            v-model.number="unhealthyNodeTimeoutInteger"
            :hide-arrows="true"
            :placeholder="t('containerResourceLimit.cpuPlaceholder')"
            :mode="mode"
            :output-modifier="true"
            :base-unit="t('cluster.machinePool.autoReplace.unit')"
            @input="value.pool.unhealthyNodeTimeout = `${unhealthyNodeTimeoutInteger}m`"
          />
        </div>
        <div class="col span-4">
          <h3>
            {{ t('cluster.machinePool.drain.header') }}
          </h3>
          <Checkbox
            v-model="value.pool.drainBeforeDelete"
            :mode="mode"
            :label="t('cluster.machinePool.drain.label')"
          />
        </div>
      </div>
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
