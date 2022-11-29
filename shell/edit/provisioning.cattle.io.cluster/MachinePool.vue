<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT } from '@shell/config/query-params';
import { importMachineConfig } from '@shell/utils/dynamic-importer';
import Taints from '@shell/components/form/Taints.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import AdvancedSection from '@shell/components/AdvancedSection.vue';
import { Banner } from '@components/Banner';
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

    cluster: {
      type:    Object,
      default: () => ({})
    },

    // no credentials are required for elemental machine pools
    credentialId: {
      type:    String,
      default: null
    },

    mode: {
      type:    String,
      default: _EDIT,
    },

    provider: {
      type:     String,
      required: true,
    },

    idx: {
      type:     Number,
      required: true,
    },

    machinePools: {
      type:    Array,
      default: () => []
    },
  },

  data() {
    const parseDuration = (duration) => {
      // The back end stores the timeout in Duration format, for example, "42d31h10m30s".
      // Here we convert that string to an integer and return the duration as seconds.
      const splitStr = duration.split(/([a-z])/);

      const durationsAsSeconds = splitStr.reduce((old, neu, idx) => {
        const parsed = parseInt(neu);

        if ( isNaN(parsed) ) {
          return old;
        }

        const interval = splitStr[(idx + 1)];

        switch (interval) {
        case 'd':
          old.push(parsed * 24 * 60 * 60);
          break;
        case 'h':
          old.push(parsed * 60 * 60);
          break;
        case 'm':
          old.push(parsed * 60);
          break;
        case 's':
          old.push(parsed);
          break;
        default:
          break;
        }

        return old;
      }, []);

      return durationsAsSeconds.reduce((old, neu) => old + neu);
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
    <hr class="mt-10">
    <component
      :is="configComponent"
      v-if="value.config"
      ref="configComponent"
      :cluster="cluster"
      :uuid="uuid"
      :mode="mode"
      :value="value.config"
      :provider="provider"
      :credential-id="credentialId"
      :pool-index="idx"
      :machine-pools="machinePools"
      @error="e=>errors = e"
    />
    <Banner
      v-else-if="value.configMissing"
      color="error"
      label-key="cluster.machinePool.configNotFound"
    />
    <Banner
      v-else
      color="info"
      label-key="cluster.machinePool.noAccessBanner"
    />

    <AdvancedSection
      :mode="mode"
      class="advanced"
    >
      <portal-target
        :name="'advanced-' + uuid"
        multiple
      />

      <div class="spacer" />
      <div class="row">
        <div class="col span-4">
          <h3>
            {{ t('cluster.machinePool.autoReplace.label') }}
            <i
              v-tooltip="t('cluster.machinePool.autoReplace.toolTip')"
              class="icon icon-info icon-lg"
            />
          </h3>
          <UnitInput
            v-model.number="unhealthyNodeTimeoutInteger"
            :hide-arrows="true"
            :placeholder="t('containerResourceLimit.cpuPlaceholder')"
            :mode="mode"
            :output-modifier="true"
            :base-unit="t('cluster.machinePool.autoReplace.unit')"
            @input="value.pool.unhealthyNodeTimeout = `${unhealthyNodeTimeoutInteger}s`"
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

      <Taints
        v-model="value.pool.taints"
        :mode="mode"
      />

      <portal-target
        :name="'advanced-footer-' + uuid"
        multiple
      />
    </AdvancedSection>
  </div>
</template>

<style lang="scss" scoped>
  .advanced ::v-deep >.vue-portal-target:empty,
  .advanced ::v-deep >.vue-portal-target:empty + .spacer {
    display: none;
  }
</style>
