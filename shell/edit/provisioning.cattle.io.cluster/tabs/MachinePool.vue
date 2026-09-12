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
import {
  disableMachinePoolAutoscaler,
  enableMachinePoolAutoscaler,
  isAutoscalerFeatureFlagEnabled,
  isMachinePoolAutoscalerEnabled,
  isMachinePoolAutoscalerPaused,
  machinePoolAutoscalerRange,
  setMachinePoolAutoscalerRange
} from '@shell/utils/autoscaler-utils';
import { RcSeparator } from '@components/RcSeparator';

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
    UnitInput,
    RcSeparator,
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

    infrastructureCluster: {
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
    },
    hideAdvanced: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      uuid: randomStr(),

      unhealthyNodeTimeoutInteger: 0,

      validationErrors: [],

      /**
       * Whether the autoscaler section is shown, held here rather than derived from the pool's range. Deriving it would
       * fold the section away the moment both bounds are empty, which is a state a user passes through whenever they
       * clear a value to type another one. Only the checkbox changes it
       */
      autoscalerEnabled: false,

      /**
       * Whether this pool's autoscaler was paused when the form opened. Held here for the same reason: it decides where
       * an edited range is written, and the pool's own answer disappears for as long as the stash is empty
       */
      autoscalerPaused: false,

      MACHINE_POOL_VALIDATION,

      fvFormRuleSets: MACHINE_POOL_VALIDATION.RULESETS,
      fvExtraRules:   {
        isAutoscalerMinSizeValid: () => this.autoscalerSizeError(this.autoscalerRange.min, this.t('cluster.machinePool.autoscaler.min')),

        isAutoscalerMaxSizeValid: () => this.autoscalerSizeError(this.autoscalerRange.max, this.t('cluster.machinePool.autoscaler.max')),

        isAutoscalerMaxGreaterThanMin: () => {
          // The range is read through the utils so it is still checked while the pool is paused and the range is stashed
          const { min = 0, max = 0 } = machinePoolAutoscalerRange(this.value?.pool);

          return max - min >= 0 ? undefined : this.t('cluster.machinePool.autoscaler.validation.isAutoscalerMaxGreaterThanMin');
        },
        uniquePoolName: (name) => {
          if (!name) {
            return undefined;
          }

          const otherPools = (this.machinePools || []).filter((p) => !p.remove && p !== this.value);
          const isDuplicate = otherPools.some((p) => p.pool.name?.toLowerCase() === name.toLowerCase());

          return isDuplicate ? this.t('cluster.machinePool.name.unique') : undefined;
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

    /**
     * The autoscaler is not the user's to change: the pool has a role the autoscaler should not manage, or the form is
     * saving. Neither is a state to explain what turning the autoscaler off would do
     */
    isAutoscalerLocked() {
      return !!(this.value?.pool?.etcdRole || this.value?.pool?.controlPlaneRole || this.busy);
    },

    isAutoscalerEnabled: {
      get() {
        return this.autoscalerEnabled;
      },
      set(val) {
        this.autoscalerEnabled = val;
        // Either way the stash is gone: turning the autoscaler off discards it, turning it on replaces it with a live
        // range, so the pool is no longer paused
        this.autoscalerPaused = false;

        if (!val) {
          disableMachinePoolAutoscaler(this.value?.pool);
        } else {
          enableMachinePoolAutoscaler(this.value?.pool, { min: 1, max: 2 });
        }
      }
    },

    /**
     * The autoscaler has been paused for this pool from the cluster detail page, so its range is stashed away until it
     * is resumed there
     */
    isAutoscalerPaused() {
      return this.autoscalerEnabled && this.autoscalerPaused;
    },

    autoscalerRange() {
      return machinePoolAutoscalerRange(this.value?.pool);
    },

    /**
     * The autoscaling range, read and written wherever it currently lives. While the pool is paused that is the stash
     * on the pool, so the range stays editable and the pool stays paused
     */
    autoscalerMinSize: {
      get() {
        return this.autoscalerRange.min;
      },
      set(min) {
        setMachinePoolAutoscalerRange(this.value?.pool, { ...this.autoscalerRange, min }, this.isAutoscalerPaused);
      }
    },

    autoscalerMaxSize: {
      get() {
        return this.autoscalerRange.max;
      },
      set(max) {
        setMachinePoolAutoscalerRange(this.value?.pool, { ...this.autoscalerRange, max }, this.isAutoscalerPaused);
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

    this.autoscalerEnabled = isMachinePoolAutoscalerEnabled(this.value?.pool);
    this.autoscalerPaused = isMachinePoolAutoscalerPaused(this.value?.pool);

    this.$emit('validationChanged', true);
  },

  beforeUnmount() {
    // Ensure we emit validation event so parent can forget any validation for this Machine Pool when it is removed
    this.$emit('validationChanged', undefined);
  },

  methods: {
    /**
     * Both bounds are required while the autoscaler section is shown, so the pool cannot be saved with an empty range,
     * and neither can be negative. Read through the range rather than the pool's fields, which are empty while it is
     * paused
     */
    autoscalerSizeError(value, key) {
      if (!this.isAutoscalerEnabled) {
        return undefined;
      }

      if (value === undefined) {
        return this.t('validation.required', { key });
      }

      return value < 0 ? this.t('validation.number.isPositive', { key }) : undefined;
    },

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
    <Banner
      v-if="isAutoscalerFeatureEnabled && isAutoscalerPaused"
      color="info"
      label-key="cluster.machinePool.autoscaler.pausedBanner"
      data-testid="machine-pool-autoscaler-paused-banner"
    />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          v-model:value="value.pool.name"
          :mode="mode"
          :label="t('cluster.machinePool.name.label')"
          :required="true"
          :disabled="!value.config || !!value.config.id || busy"
          :require-dirty="false"
          :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.NAME)"
          data-testid="machine-pool-name-input"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-if="!isAutoscalerFeatureEnabled || !isAutoscalerEnabled || isAutoscalerPaused"
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
        <p
          v-if="isAutoscalerFeatureEnabled && isAutoscalerEnabled && !value.pool.etcdRole && !value.pool.controlPlaneRole"
          class="text-muted text-small mt-5"
          data-testid="machine-pool-autoscaler-role-hint"
        >
          {{ t('cluster.machinePool.autoscaler.roleHint') }}
        </p>
      </div>
    </div>
    <RcSeparator class="mt-10" />
    <component
      :is="configComponent"
      v-if="value.config && configComponent"
      ref="configComponent"
      v-model:is-ipv6="value.isIpv6"
      v-model:is-dualStack="value.isDualStack"
      :cluster="cluster"
      :infrastructure-cluster="infrastructureCluster"
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
      v-if="!hideAdvanced"
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
              :disabled="isAutoscalerLocked"
            />
            <p
              v-if="isAutoscalerEnabled && !isAutoscalerLocked"
              class="text-muted text-small mt-5"
              data-testid="machine-pool-autoscaler-disable-hint"
            >
              {{ t('cluster.machinePool.autoscaler.disableHint') }}
            </p>
          </div>
        </div>
        <div
          v-if="isAutoscalerEnabled"
          class="row"
        >
          <div class="col span-4">
            <UnitInput
              v-model:value="autoscalerMinSize"
              :label="t('cluster.machinePool.autoscaler.min')"
              :hide-arrows="true"
              :placeholder="t('containerResourceLimit.cpuPlaceholder')"
              :mode="mode"
              :base-unit="t('cluster.machinePool.autoscaler.baseUnit')"
              :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.AUTOSCALER_MIN)"
              :required="true"
              :disabled="isAutoscalerLocked"
              data-testid="machine-pool-autoscaler-min-input"
            />
          </div>
          <div class="col span-4">
            <UnitInput
              v-model:value="autoscalerMaxSize"
              :label="t('cluster.machinePool.autoscaler.max')"
              :hide-arrows="true"
              :placeholder="t('containerResourceLimit.cpuPlaceholder')"
              :mode="mode"
              :base-unit="t('cluster.machinePool.autoscaler.baseUnit')"
              :rules="fvGetAndReportPathRules(MACHINE_POOL_VALIDATION.FIELDS.AUTOSCALER_MAX)"
              :required="true"
              :disabled="isAutoscalerLocked"
              data-testid="machine-pool-autoscaler-max-input"
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
