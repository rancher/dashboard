<script>
import { get } from '@shell/utils/object';
import RadioGroup from '@shell/components/form/RadioGroup';
import UnitInput from '@shell/components/form/UnitInput';
import { WORKLOAD_TYPES } from '@shell/config/types';
import { _CREATE } from '@shell/config/query-params';
import { mapGetters } from 'vuex';
import InputWithSelect from '@shell/components/form/InputWithSelect';

export default {
  components: {
    RadioGroup, UnitInput, InputWithSelect
  },
  props:      {
    // spec
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    type: {
      type:    String,
      default: WORKLOAD_TYPES.DEPLOYMENT
    },

    mode: { type: String, default: _CREATE },
  },
  data() {
    const {
      strategy:strategyObj = {}, minReadySeconds = 0, progressDeadlineSeconds = 600, revisionHistoryLimit = 10, podManagementPolicy = 'OrderedReady'
    } = this.value;
    const strategy = strategyObj.type || 'RollingUpdate';
    let maxSurge = '25';
    let maxUnavailable = '25';
    let surgeUnits = '%';
    let unavailableUnits = '%';

    if (strategyObj.rollingUpdate) {
      maxSurge = strategyObj.rollingUpdate.maxSurge;
      maxUnavailable = strategyObj.rollingUpdate.maxUnavailable;

      if ( typeof maxSurge === 'string' && maxSurge.includes('%')) {
        maxSurge = maxSurge.slice(0, maxSurge.indexOf('%'));
      } else {
        surgeUnits = 'Pods';
      }

      if ( typeof maxUnavailable === 'string' && maxUnavailable.includes('%')) {
        unavailableUnits = '%';
        maxUnavailable = maxUnavailable.slice(0, maxUnavailable.indexOf('%'));
      } else {
        unavailableUnits = 'Pods';
      }
    }

    const podSpec = get(this.value, 'template.spec');

    const { terminationGracePeriodSeconds = 30 } = podSpec;

    return {
      surgeUnits,
      unavailableUnits,
      strategy,
      minReadySeconds,
      progressDeadlineSeconds,
      maxSurge,
      maxUnavailable,
      revisionHistoryLimit,
      terminationGracePeriodSeconds,
      podManagementPolicy
    };
  },
  computed: {
    strategyOptions() {
      switch (this.type) {
      case WORKLOAD_TYPES.DEPLOYMENT:
        return {
          options: ['RollingUpdate', 'Recreate'],
          labels:  [this.t('workload.upgrading.strategies.labels.rollingUpdate'), this.t('workload.upgrading.strategies.labels.recreate')]
        };
      case WORKLOAD_TYPES.DAEMON_SET:
      case WORKLOAD_TYPES.STATEFUL_SET:
        return {
          options: ['RollingUpdate', 'Delete'],
          labels:  [this.t('workload.upgrading.strategies.labels.rollingUpdate'), this.t('workload.upgrading.strategies.labels.delete')]
        };
      default:
        return null;
      }
    },

    isDeployment() {
      return this.type === WORKLOAD_TYPES.DEPLOYMENT;
    },

    isStatefulSet() {
      return this.type === WORKLOAD_TYPES.STATEFUL_SET;
    },

    isDaemonSet() {
      return this.type === WORKLOAD_TYPES.DAEMON_SET;
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    update() {
      const podSpec = this.value?.template?.spec;
      const {
        minReadySeconds, revisionHistoryLimit, progressDeadlineSeconds, terminationGracePeriodSeconds
      } = this;
      let { maxSurge, maxUnavailable } = this;

      if (this.surgeUnits === '%' && !maxSurge.includes('%')) {
        maxSurge = `${ maxSurge }%`;
      }
      if (this.unavailableUnits === '%' && !maxUnavailable.includes('%')) {
        maxUnavailable = `${ maxUnavailable }%`;
      }

      this.$set(podSpec, 'terminationGracePeriodSeconds', terminationGracePeriodSeconds);

      switch (this.type) {
      case WORKLOAD_TYPES.DEPLOYMENT: {
        let strategy;

        if (this.strategy === 'RollingUpdate') {
          strategy = {
            rollingUpdate: {
              maxSurge,
              maxUnavailable,
            },
            type: this.strategy
          };
        } else {
          strategy = { type: this.strategy };
        }

        Object.assign(this.value, {
          strategy, minReadySeconds, revisionHistoryLimit, progressDeadlineSeconds
        });
        break;
      }
      case WORKLOAD_TYPES.DAEMON_SET: {
        let updateStrategy;

        if (this.strategy === 'RollingUpdate') {
          updateStrategy = { rollingUpdate: { maxUnavailable }, type: this.strategy };
        } else {
          updateStrategy = { type: this.strategy };
        }

        Object.assign(this.value, {
          updateStrategy, minReadySeconds, revisionHistoryLimit
        });
        break;
      }
      case WORKLOAD_TYPES.STATEFUL_SET: {
        const updateStrategy = { type: this.strategy };

        Object.assign(this.value, {
          updateStrategy, revisionHistoryLimit, podManagementPolicy: this.podManagementPolicy
        });
        break;
      }
      default:
        break;
      }
    },

    updateWithUnits({ selected:units, text:value }, target) {
      if (units === 'Pods') {
        this[target] = parseInt(value);
      } else {
        this[target] = `${ value }%`;
      }
      if (target === 'maxSurge') {
        this.surgeUnits = units;
      } else {
        this.unavailableUnits = units;
      }

      this.update();
    }
  },
};
</script>

<template>
  <div @input="update">
    <!--workload  spec.upgradeStrategy -->
    <div v-if="strategyOptions" class="row mb-20">
      <div class="col">
        <RadioGroup
          v-model="strategy"
          name="strategy"
          :options="strategyOptions.options"
          :labels="strategyOptions.labels"
          :mode="mode"
          @input="update"
        />
      </div>
    </div>
    <div v-if="isStatefulSet" class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="podManagementPolicy"
          name="podManagement"
          :mode="mode"
          :label="t('workload.upgrading.podManagementPolicy.label')"
          :options="['OrderedReady', 'Parallel']"
          @input="update"
        />
      </div>
    </div>
    <template v-if="strategy === 'RollingUpdate'">
      <div v-if="isDeployment || isDaemonSet" class="row mb-20">
        <div v-if="isDeployment" class="col span-6">
          <InputWithSelect
            :text-value="maxSurge"
            :select-before-text="false"
            :select-value="surgeUnits"
            :text-label="t('workload.upgrading.maxSurge.label')"
            :mode="mode"
            type="number"
            :options="['Pods', '%']"
            @input="e=>updateWithUnits(e, 'maxSurge')"
          />
        </div>
        <div class="col span-6">
          <InputWithSelect
            :text-value="maxUnavailable"
            :select-before-text="false"
            :select-value="unavailableUnits"
            :text-label="t('workload.upgrading.maxUnavailable.label')"
            :mode="mode"
            type="number"
            :options="['Pods', '%']"
            @input="e=>updateWithUnits(e, 'maxUnavailable')"
          />
        </div>
      </div>
    </template>

    <!-- workload spec -->
    <div class="row mb-20">
      <div v-if="!isStatefulSet" class="col span-6">
        <UnitInput
          v-model="minReadySeconds"
          :suffix="t('suffix.seconds', {count: minReadySeconds})"
          label-key="workload.upgrading.minReadySeconds.label"
          tooltip-key="workload.upgrading.minReadySeconds.tip"
          :mode="mode"
        />
      </div>
      <div v-if="isDeployment || isStatefulSet || isDaemonSet" class="col span-6">
        <UnitInput
          v-model="revisionHistoryLimit"
          :suffix="t('suffix.revisions', {count: revisionHistoryLimit})"
          label-key="workload.upgrading.revisionHistoryLimit.label"
          tooltip-key="workload.upgrading.revisionHistoryLimit.tip"
          :mode="mode"
        />
      </div>
    </div>
    <div v-if="isDeployment" class="row mb-20">
      <div class="col span-6">
        <UnitInput
          v-model="progressDeadlineSeconds"
          :suffix="t('suffix.seconds', {count: progressDeadlineSeconds})"
          label-key="workload.upgrading.progressDeadlineSeconds.label"
          tooltip-key="workload.upgrading.progressDeadlineSeconds.tip"
          :mode="mode"
        />
      </div>
    </div>

    <!-- pod spec -->
    <div class="row">
      <div class="col span-6">
        <UnitInput
          v-model="terminationGracePeriodSeconds"
          :suffix="t('suffix.seconds', {count: terminationGracePeriodSeconds})"
          label-key="workload.upgrading.terminationGracePeriodSeconds.label"
          tooltip-key="workload.upgrading.terminationGracePeriodSeconds.tip"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
