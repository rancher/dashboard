<script>
import { WORKLOAD_TYPES } from '@shell/config/types';
import UnitInput from '@shell/components/form/UnitInput';
import LabeledInput from '@shell/components/form/LabeledInput';
import RadioGroup from '@shell/components/form/RadioGroup';
import { mapGetters } from 'vuex';

export default {
  components: {
    UnitInput, LabeledInput, RadioGroup
  },
  props:      {
    // workload spec
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    type: {
      type:    String,
      default: WORKLOAD_TYPES.JOB
    },

    mode: {
      type:    String,
      default: 'create'
    }
  },

  data() {
    const {
      failedJobsHistoryLimit, successfulJobsHistoryLimit, suspend = false, schedule,
    } = this.value;

    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      if (!this.value.jobTemplate) {
        this.$set(this.value, 'jobTemplate', { spec: {} });
      }
      const { concurrencyPolicy = 'Allow', startingDeadlineSeconds } = this.value;
      const {
        completions, parallelism, backoffLimit, activeDeadlineSeconds,
        template:{ spec: { terminationGracePeriodSeconds } }

      } = this.value.jobTemplate.spec;

      return {
        completions, parallelism, backoffLimit, activeDeadlineSeconds, failedJobsHistoryLimit, successfulJobsHistoryLimit, suspend, schedule, concurrencyPolicy, startingDeadlineSeconds, terminationGracePeriodSeconds
      };
    } else {
      const {
        completions, parallelism, backoffLimit, activeDeadlineSeconds,
        template:{ spec: { terminationGracePeriodSeconds } }
      } = this.value;

      return {
        completions, parallelism, backoffLimit, activeDeadlineSeconds, failedJobsHistoryLimit, successfulJobsHistoryLimit, suspend, schedule, terminationGracePeriodSeconds
      };
    }
  },

  computed: {
    isCronJob() {
      return this.type === WORKLOAD_TYPES.CRON_JOB;
    },
    ...mapGetters({ t: 'i18n/t' })
  },

  methods: {
    update() {
      if (this.type === WORKLOAD_TYPES.JOB) {
        const spec = {
          ...this.value,
          suspend:                    this.suspend,
          schedule:                   this.schedule,
          completions:           this.completions,
          parallelism:           this.parallelism,
          backoffLimit:          this.backoffLimit,
          activeDeadlineSeconds: this.activeDeadlineSeconds,
        };

        spec.template.spec.terminationGracePeriodSeconds = this.terminationGracePeriodSeconds;

        this.$emit('input', spec);
      } else {
        const spec = {
          ...this.value,
          failedJobsHistoryLimit:     this.failedJobsHistoryLimit,
          successfulJobsHistoryLimit: this.successfulJobsHistoryLimit,
          suspend:                    this.suspend,
          concurrencyPolicy:          this.concurrencyPolicy,
          startingDeadlineSeconds:    this.startingDeadlineSeconds,
          jobTemplate:                { ...this.value.jobTemplate }
        };
        const jobSpec = {
          completions:           this.completions,
          parallelism:           this.parallelism,
          backoffLimit:          this.backoffLimit,
          activeDeadlineSeconds: this.activeDeadlineSeconds
        };

        Object.assign(spec.jobTemplate.spec, jobSpec );

        spec.jobTemplate.spec.template.spec.terminationGracePeriodSeconds = this.terminationGracePeriodSeconds;

        this.$emit('input', spec);
      }
    },

  }
};
</script>

<template>
  <form @input="update">
    <div class="row mb-20">
      <div class="col span-6">
        <UnitInput
          v-model="completions"
          :mode="mode"
          :suffix="t('suffix.times', {count: completions})"
          label-key="workload.job.completions.label"
          tooltip-key="workload.job.completions.tip"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model="parallelism"
          :mode="mode"
          :suffix="t('suffix.times', {count: parallelism})"
          label-key="workload.job.parallelism.label"
          tooltip-key="workload.job.parallelism.tip"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <UnitInput
          v-model="backoffLimit"
          :mode="mode"
          :suffix="t('suffix.times', {count: backoffLimit})"
          label-key="workload.job.backoffLimit.label"
          tooltip-key="workload.job.backoffLimit.tip"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model="activeDeadlineSeconds"
          :mode="mode"
          :suffix="t('suffix.seconds', {count: activeDeadlineSeconds})"
          label-key="workload.job.activeDeadlineSeconds.label"
          tooltip-key="workload.job.activeDeadlineSeconds.tip"
        />
      </div>
    </div>

    <template v-if="isCronJob">
      <div class="row  mb-20">
        <div class="col span-6">
          <LabeledInput
            v-model.number="successfulJobsHistoryLimit"
            :mode="mode"
            label-key="workload.job.successfulJobsHistoryLimit.label"
            tooltip-key="workload.job.successfulJobsHistoryLimit.tip"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model.number="failedJobsHistoryLimit"
            :mode="mode"
            label-key="workload.job.failedJobsHistoryLimit.label"
            tooltip-key="workload.job.failedJobsHistoryLimit.tip"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div class="col span-6">
          <UnitInput
            v-model="startingDeadlineSeconds"
            :mode="mode"
            :suffix="t('suffix.seconds', {count: startingDeadlineSeconds})"
            label-key="workload.job.startingDeadlineSeconds.label"
            tooltip-key="workload.job.startingDeadlineSeconds.tip"
          />
        </div>
        <div class="col span-6">
          <UnitInput v-model="terminationGracePeriodSeconds" :suffix="terminationGracePeriodSeconds == 1 ? 'Second' : 'Seconds'" :label="t('workload.upgrading.activeDeadlineSeconds.label')" :mode="mode">
            <template #label>
              <label class="has-tooltip" :style="{'color':'var(--input-label)'}">
                {{ t('workload.upgrading.terminationGracePeriodSeconds.label') }}
                <i v-tooltip="t('workload.upgrading.terminationGracePeriodSeconds.tip')" class="icon icon-info" />
              </label>
            </template>
          </UnitInput>
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <RadioGroup
            v-model="concurrencyPolicy"
            :mode="mode"
            :label="t('workload.upgrading.concurrencyPolicy.label')"
            name="concurrency"
            :options="['Allow', 'Forbid', 'Replace']"
            :labels="[t('workload.upgrading.concurrencyPolicy.options.allow'), t('workload.upgrading.concurrencyPolicy.options.forbid'), t('workload.upgrading.concurrencyPolicy.options.replace')]"
            @input="update"
          />
        </div>
        <div class="col span-6">
          <RadioGroup
            v-model="suspend"
            :mode="mode"
            :label="t('workload.job.suspend')"
            name="suspend"
            :options="[true, false]"
            :labels="['Yes', 'No']"
            @input="update"
          />
        </div>
      </div>
    </template>
    <div v-else class="row">
      <div class="col span-6">
        <UnitInput v-model="terminationGracePeriodSeconds" :suffix="terminationGracePeriodSeconds == 1 ? 'Second' : 'Seconds'" :label="t('workload.upgrading.activeDeadlineSeconds.label')" :mode="mode">
          <template #label>
            <label class="has-tooltip" :style="{'color':'var(--input-label)'}">
              {{ t('workload.upgrading.terminationGracePeriodSeconds.label') }}
              <i v-tooltip="t('workload.upgrading.terminationGracePeriodSeconds.tip')" class="icon icon-info" />
            </label>
          </template>
        </UnitInput>
      </div>
    </div>
  </form>
</template>
