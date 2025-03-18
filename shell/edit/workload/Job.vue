<script>
import { WORKLOAD_TYPES } from '@shell/config/types';
import UnitInput from '@shell/components/form/UnitInput';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import { mapGetters } from 'vuex';

export default {
  emits:      ['update:value'],
  components: {
    UnitInput, LabeledInput, RadioGroup
  },
  props: {
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
      failedJobsHistoryLimit,
      successfulJobsHistoryLimit,
      suspend = false,
      schedule,
    } = this.value;

    if (this.type === WORKLOAD_TYPES.CRON_JOB) {
      // Initialize both value specs if empty
      if (!this.value.jobTemplate) {
        this.value['jobTemplate'] = { spec: {} };
      }
      if (!this.value.jobTemplate.spec.template) {
        this.value.jobTemplate.spec['template'] = { spec: {} };
      }
      const {
        concurrencyPolicy = 'Allow',
        startingDeadlineSeconds
      } = this.value;
      const {
        completions,
        parallelism,
        backoffLimit,
        activeDeadlineSeconds,
        template:{ spec: { terminationGracePeriodSeconds } }
      } = this.value.jobTemplate.spec;

      return {
        completions,
        parallelism,
        backoffLimit,
        activeDeadlineSeconds,
        failedJobsHistoryLimit,
        successfulJobsHistoryLimit,
        suspend,
        schedule,
        concurrencyPolicy,
        startingDeadlineSeconds,
        terminationGracePeriodSeconds
      };
    } else {
      if (!this.value.template) {
        this.value['template'] = { spec: {} };
      }
      const {
        completions,
        parallelism,
        backoffLimit,
        activeDeadlineSeconds,
        template:{ spec: { terminationGracePeriodSeconds } }
      } = this.value;

      return {
        completions,
        parallelism,
        backoffLimit,
        activeDeadlineSeconds,
        failedJobsHistoryLimit,
        successfulJobsHistoryLimit,
        suspend,
        schedule,
        terminationGracePeriodSeconds
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
          suspend:               this.suspend,
          schedule:              this.schedule,
          completions:           this.completions,
          parallelism:           this.parallelism,
          backoffLimit:          this.backoffLimit,
          activeDeadlineSeconds: this.activeDeadlineSeconds,
        };

        spec.template.spec.terminationGracePeriodSeconds = this.terminationGracePeriodSeconds;

        this.$emit('update:value', spec);
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

        this.$emit('update:value', spec);
      }
    },

  }
};
</script>

<template>
  <form>
    <div class="row mb-20">
      <div
        data-testid="input-job-completions"
        class="col span-6"
      >
        <UnitInput
          v-model:value="completions"
          :mode="mode"
          :suffix="t('suffix.times', {count: completions})"
          label-key="workload.job.completions.label"
          tooltip-key="workload.job.completions.tip"
          @update:value="update"
        />
      </div>
      <div
        data-testid="input-job-parallelism"
        class="col span-6"
      >
        <UnitInput
          v-model:value="parallelism"
          :mode="mode"
          :suffix="t('suffix.times', {count: parallelism})"
          label-key="workload.job.parallelism.label"
          tooltip-key="workload.job.parallelism.tip"
          @update:value="update"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div
        data-testid="input-job-backoffLimit"
        class="col span-6"
      >
        <UnitInput
          v-model:value="backoffLimit"
          :mode="mode"
          :suffix="t('suffix.times', {count: backoffLimit})"
          label-key="workload.job.backoffLimit.label"
          tooltip-key="workload.job.backoffLimit.tip"
          @update:value="update"
        />
      </div>
      <div
        data-testid="input-job-activeDeadlineSeconds"
        class="col span-6"
      >
        <UnitInput
          v-model:value="activeDeadlineSeconds"
          :mode="mode"
          :suffix="t('suffix.seconds', {count: activeDeadlineSeconds})"
          label-key="workload.job.activeDeadlineSeconds.label"
          tooltip-key="workload.job.activeDeadlineSeconds.tip"
          @update:value="update"
        />
      </div>
    </div>

    <template v-if="isCronJob">
      <div class="row  mb-20">
        <div
          data-testid="input-job-successful"
          class="col span-6"
        >
          <LabeledInput
            v-model:value.number="successfulJobsHistoryLimit"
            :mode="mode"
            label-key="workload.job.successfulJobsHistoryLimit.label"
            tooltip-key="workload.job.successfulJobsHistoryLimit.tip"
            @input="update"
          />
        </div>
        <div
          data-testid="input-job-failed"
          class="col span-6"
        >
          <LabeledInput
            v-model:value.number="failedJobsHistoryLimit"
            :mode="mode"
            label-key="workload.job.failedJobsHistoryLimit.label"
            tooltip-key="workload.job.failedJobsHistoryLimit.tip"
            @input="update"
          />
        </div>
      </div>
      <div class="row mb-20">
        <div
          data-testid="input-job-startingDeadlineSeconds"
          class="col span-6"
        >
          <UnitInput
            v-model:value="startingDeadlineSeconds"
            :mode="mode"
            :suffix="t('suffix.seconds', {count: startingDeadlineSeconds})"
            label-key="workload.job.startingDeadlineSeconds.label"
            tooltip-key="workload.job.startingDeadlineSeconds.tip"
            @update:value="update"
          />
        </div>
        <div
          data-testid="input-job-termination"
          class="col span-6"
        >
          <UnitInput
            v-model:value="terminationGracePeriodSeconds"
            :suffix="t('suffix.seconds', { count: terminationGracePeriodSeconds })"
            :label="t('workload.upgrading.activeDeadlineSeconds.label')"
            :mode="mode"
            @update:value="update"
          >
            <template #label>
              <label
                class="v-popper--has-tooltip"
                :style="{'color':'var(--input-label)'}"
              >
                {{ t('workload.upgrading.terminationGracePeriodSeconds.label') }}
                <i
                  v-clean-tooltip="t('workload.upgrading.terminationGracePeriodSeconds.tip')"
                  class="icon icon-info"
                />
              </label>
            </template>
          </UnitInput>
        </div>
      </div>
      <div class="row">
        <div
          data-testid="input-job-concurrencyPolicy"

          class="col span-6"
        >
          <RadioGroup
            v-model:value="concurrencyPolicy"
            :mode="mode"
            :label="t('workload.upgrading.concurrencyPolicy.label')"
            name="concurrency"
            :options="['Allow', 'Forbid', 'Replace']"
            :labels="[t('workload.upgrading.concurrencyPolicy.options.allow'), t('workload.upgrading.concurrencyPolicy.options.forbid'), t('workload.upgrading.concurrencyPolicy.options.replace')]"
            @update:value="update"
          />
        </div>
        <div
          data-testid="input-job-suspend"
          class="col span-6"
        >
          <RadioGroup
            v-model:value="suspend"
            :mode="mode"
            :label="t('workload.job.suspend')"
            name="suspend"
            :options="[true, false]"
            :labels="['Yes', 'No']"
            @update:value="update"
          />
        </div>
      </div>
    </template>
    <div
      v-else
      class="row"
    >
      <div
        data-testid="input-job-termination"
        class="col span-6"
      >
        <UnitInput
          v-model:value="terminationGracePeriodSeconds"
          :suffix="t('suffix.seconds', { count: terminationGracePeriodSeconds })"
          :label="t('workload.upgrading.activeDeadlineSeconds.label')"
          :mode="mode"
        >
          <template #label>
            <label
              class="v-popper--has-tooltip"
              :style="{'color':'var(--input-label)'}"
            >
              {{ t('workload.upgrading.terminationGracePeriodSeconds.label') }}
              <i
                v-clean-tooltip="t('workload.upgrading.terminationGracePeriodSeconds.tip')"
                class="icon icon-info"
              />
            </label>
          </template>
        </UnitInput>
      </div>
    </div>
  </form>
</template>
