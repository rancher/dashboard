<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import { _EDIT } from '@shell/config/query-params';
import Taints from '@shell/components/form/Taints.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import AdvancedSection from '@shell/components/AdvancedSection.vue';
import { Banner } from '@components/Banner';
import UnitInput from '@shell/components/form/UnitInput.vue';
import { randomStr } from '@shell/utils/string';
import FormValidation from '@shell/mixins/form-validation';
import { MACHINE_POOL_VALIDATION } from '@shell/utils/validators/machine-pool';
import { isAutoscalerFeatureFlagEnabled } from '@shell/utils/autoscaler-utils';

export default {

  name: 'MachinePool',

  emits: ['validationChanged', 'error'],

  components: {
    LabeledInput,
    Checkbox,
    Taints,
    KeyValue,
    AdvancedSection,
    Banner,
    UnitInput
  },

  mixins: [FormValidation],

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
    projectId: {
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

    // Is the UI busy (e.g. during save)
    busy: {
      type:    Boolean,
      default: false,
    },

    poolId: {
      type:     String,
      required: true,
    },

    // this is a useful info when in edit mode you add a new pool, example of use in vmwarevsphere.vue
    poolCreateMode: {
      type:     Boolean,
      required: true,
    }
  },

  data() {
    return {
      uuid: randomStr(),

      unhealthyNodeTimeoutInteger: 0,

      validationErrors: [],

      MACHINE_POOL_VALIDATION,

      fvFormRuleSets: MACHINE_POOL_VALIDATION.RULESETS,
      fvExtraRules:   {
        isAutoscalerMaxGreaterThanMin: () => {
          const min = this.value?.pool?.autoscalingMinSize || 0;
          const max = this.value?.pool?.autoscalingMaxSize || 0;

          return max - min >= 0 ? undefined : this.t('cluster.machinePool.autoscaler.validation.isAutoscalerMaxGreaterThanMin');
        }
      }
    };
  },

  computed: {
    configComponent() {
      if (this.$store.getters['type-map/hasCustomMachineConfigComponent'](this.provider)) {
        return this.$store.getters['type-map/importMachineConfig'](this.provider);
      }

      return this.$store.getters['type-map/importMachineConfig']('generic');
    },

    isWindows() {
      return this.value?.config?.os === 'windows';
    },

    isAutoscalerFeatureEnabled() {
      return isAutoscalerFeatureFlagEnabled(this.$store);
    },

    isAutoscalerEnabled: {
      get() {
        return typeof this.value?.pool?.autoscalingMinSize !== 'undefined' || typeof this.value?.pool?.autoscalingMinSize !== 'undefined';
      },
      set(val) {
        if (!val) {
          delete this.value.pool.autoscalingMinSize;
          delete this.value.pool.autoscalingMaxSize;
        } else {
          this.value.pool.autoscalingMinSize = 1;
          this.value.pool.autoscalingMaxSize = 2;
        }
      }
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
    },

    validationErrors: {
      handler(newValue) {
        this.$emit('validationChanged', newValue.length === 0);
      },
      deep: true
    },

    fvFormIsValid: {
      handler(newValue) {
        this.$emit('validationChanged', newValue);
      },
      deep: true
    },

    'value.pool.etcdRole'(neu) {
      if (neu) {
        this.isAutoscalerEnabled = false;
      }
    },
    'value.pool.controlPlaneRole'(neu) {
      if (neu) {
        this.isAutoscalerEnabled = false;
      }
    },
  },

  /**
   * On creation, ensure that the pool is marked valid - custom machine pools can emit further validation events
   */
  created() {
    this.unhealthyNodeTimeoutInteger = this.value.pool.unhealthyNodeTimeout ? this.parseDuration(this.value.pool.unhealthyNodeTimeout) : 0;

    this.$emit('validationChanged', true);
  },

  beforeUnmount() {
    // Ensure we emit validation event so parent can forget any validation for this Machine Pool when it is removed
    this.$emit('validationChanged', undefined);
  },

  methods: {
    parseDuration(duration) {
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
    },
    emitError(e) {
      this.$emit('error', e);
    },
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
    },
    // handle emitted matched machine inventories on selector so that machine count
    // on machine pool can be kept up to date
    // (only used on Elemental because it comes from "machineinventoryselectortemplate" machine-config)
    updateMachineCount(val) {
      this.value.pool.quantity = val || 1;
    },

    expandAdvanced() {
      const advancedComponent = this.$refs.advanced;

      if (advancedComponent && !advancedComponent.show) {
        advancedComponent.toggle();
      }
    },

    // Propagate up validation status for this Machine Pool
    validationChanged(val) {
      this.$emit('validationChanged', val);
    }
  }
};
</script>

<template>
  <div>
    <Banner
      v-if="value.pool.hostnameLengthLimit"
      color="info"
    >
      <div class="text">
        {{ t('cluster.machinePool.truncationPool', { limit: value.pool.hostnameLengthLimit }) }}
      </div>
    </Banner>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.pool.name"
          :mode="mode"
          :label="t('cluster.machinePool.name.label')"
          :required="true"
          :disabled="!value.config || !!value.config.id || busy"
          :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.NAME)"
          data-testid="machine-pool-name-input"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-if="!isAutoscalerFeatureEnabled || !isAutoscalerEnabled"
          v-model:value.number="value.pool.quantity"
          :mode="mode"
          :label="t('cluster.machinePool.quantity.label')"
          :disabled="busy"
          type="number"
          min="0"
          :required="true"
          :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.QUANTITY)"
          data-testid="machine-pool-quantity-input"
        />
        <LabeledInput
          v-else
          :value="t('cluster.machinePool.autoscaler.machineCountValueOverride')"
          :mode="mode"
          :label="t('cluster.machinePool.quantity.label')"
          :disabled="true"
          :required="true"
          data-testid="machine-pool-quantity-input"
        />
      </div>
      <div class="col span-4 pt-5">
        <h3>
          {{ t('cluster.machinePool.role.label') }}
        </h3>
        <Checkbox
          v-model:value="value.pool.etcdRole"
          :mode="mode"
          :label="t('cluster.machinePool.role.etcd')"
          :disabled="isWindows || busy"
        />
        <Checkbox
          v-model:value="value.pool.controlPlaneRole"
          :mode="mode"
          :label="t('cluster.machinePool.role.controlPlane')"
          :disabled="isWindows || busy"
        />
        <Checkbox
          v-model:value="value.pool.workerRole"
          :mode="mode"
          :label="t('cluster.machinePool.role.worker')"
          :disabled="busy"
        />
      </div>
    </div>
    <hr
      class="mt-10"
      role="none"
    >
    <component
      :is="configComponent"
      v-if="value.config && configComponent"
      ref="configComponent"
      v-model:has-ipv6="value.hasIpv6"
      :cluster="cluster"
      :uuid="uuid"
      :mode="mode"
      :value="value.config"
      :provider="provider"
      :credential-id="credentialId"
      :project-id="projectId"
      :pool-index="idx"
      :pool-id="poolId"
      :pool-create-mode="value.create"
      :machine-pools="machinePools"
      :busy="busy"
      @error="emitError"
      @updateMachineCount="updateMachineCount"
      @expandAdvanced="expandAdvanced"
      @validationChanged="validationChanged"
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
      ref="advanced"
      :mode="mode"
      class="advanced"
    >
      <portal-target
        :name="'advanced-' + uuid"
        multiple
      />

      <div class="spacer" />
      <h3>
        {{ t('cluster.machinePool.automation.label') }}
      </h3>
      <div class="row">
        <div class="col span-4">
          <h4>
            {{ t('cluster.machinePool.autoReplace.label') }}
            <i
              v-clean-tooltip="t('cluster.machinePool.autoReplace.toolTip')"
              class="icon icon-info icon-lg"
            />
          </h4>
          <UnitInput
            v-model:value="unhealthyNodeTimeoutInteger"
            :hide-arrows="true"
            :placeholder="t('containerResourceLimit.cpuPlaceholder')"
            :mode="mode"
            :output-modifier="true"
            :base-unit="t('cluster.machinePool.autoReplace.unit')"
            :disabled="busy"
            @update:value="value.pool.unhealthyNodeTimeout = `${unhealthyNodeTimeoutInteger}s`"
          />
        </div>
        <div class="col span-4">
          <h4>
            {{ t('cluster.machinePool.drain.header') }}
          </h4>
          <Checkbox
            v-model:value="value.pool.drainBeforeDelete"
            :mode="mode"
            :label="t('cluster.machinePool.drain.label')"
            :disabled="busy"
          />
        </div>
      </div>
      <div v-if="isAutoscalerFeatureEnabled">
        <div class="row mt-10">
          <div class="col span-12">
            <h4>
              {{ t('cluster.machinePool.autoscaler.heading') }}
            </h4>
            <Banner
              v-if="value.pool.etcdRole || value.pool.controlPlaneRole"
              color="warning"
              label-key="cluster.machinePool.autoscaler.etcdControlPlaneWarning"
            />
            <Checkbox
              v-model:value="isAutoscalerEnabled"
              :mode="mode"
              :label="t('cluster.machinePool.autoscaler.enable', undefined, true)"
              :disabled="value.pool.etcdRole || value.pool.controlPlaneRole || busy"
            />
          </div>
        </div>
        <div
          v-if="isAutoscalerEnabled"
          class="row"
        >
          <div class="col span-4">
            <UnitInput
              v-model:value="value.pool.autoscalingMinSize"
              :label="t('cluster.machinePool.autoscaler.min')"
              :hide-arrows="true"
              :placeholder="t('containerResourceLimit.cpuPlaceholder')"
              :mode="mode"
              :base-unit="t('cluster.machinePool.autoscaler.baseUnit')"
              :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.AUTOSCALER_MIN)"
              :disabled="value.pool.etcdRole || value.pool.controlPlaneRole || busy"
            />
          </div>
          <div class="col span-4">
            <UnitInput
              v-model:value="value.pool.autoscalingMaxSize"
              :label="t('cluster.machinePool.autoscaler.max')"
              :hide-arrows="true"
              :placeholder="t('containerResourceLimit.cpuPlaceholder')"
              :mode="mode"
              :base-unit="t('cluster.machinePool.autoscaler.baseUnit')"
              :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.AUTOSCALER_MAX)"
              :disabled="value.pool.etcdRole || value.pool.controlPlaneRole || busy"
            />
          </div>
        </div>
      </div>
      <div class="spacer" />
      <KeyValue
        v-model:value="value.pool.labels"
        :add-label="t('labels.addLabel')"
        :disabled="busy"
        :mode="mode"
        :title="t('cluster.machinePool.labels.label')"
        :read-allowed="false"
        :value-can-be-empty="true"
      />

      <div class="spacer" />

      <Taints
        v-model:value="value.pool.taints"
        :mode="mode"
        :disabled="busy"
      />

      <portal-target
        :name="'advanced-footer-' + uuid"
        multiple
      />
    </AdvancedSection>
  </div>
</template>

<style lang="scss" scoped>
  .advanced :deep() >.vue-portal-target:empty,
  .advanced :deep() >.vue-portal-target:empty + .spacer {
    display: none;
  }
</style>
