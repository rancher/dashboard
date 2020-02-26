<script>
import { WORKLOAD } from '../../config/types';
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import RadioGroup from '@/components/form/RadioGroup';

export default {
  components: {
    UnitInput, LabeledInput, RadioGroup
  },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    type: {
      type:    String,
      default: WORKLOAD.JOB
    }
  },
  data() {
    const {
      failedJobsHistoryLimit, successfulJobsHistoryLimit, suspend, schedule
    } = this.value;

    if (this.type === WORKLOAD.CRON_JOB) {
      if (!this.value.jobTemplate) {
        this.$set(this.value, 'jobTemplate', { spec: {} });
      }
      const {
        completions, parallelism, backOffLimit, activeDeadlineSeconds
      } = this.value.jobTemplate.spec;

      return {
        completions, parallelism, backOffLimit, activeDeadlineSeconds, failedJobsHistoryLimit, successfulJobsHistoryLimit, suspend, schedule
      };
    } else {
      const {
        completions, parallelism, backOffLimit, activeDeadlineSeconds
      } = this.value;

      return {
        completions, parallelism, backOffLimit, activeDeadlineSeconds, failedJobsHistoryLimit, successfulJobsHistoryLimit, suspend, schedule
      };
    }
  },
  computed: {
    isCronJob() {
      return this.type === WORKLOAD.CRON_JOB;
    }
  },
  methods: {
    update() {
      if (this.type === WORKLOAD.JOB) {
        const spec = {
          ...this.value,
          suspend:                    this.suspend,
          schedule:                   this.schedule,
          completions:           this.completions,
          parallelism:           this.parallelism,
          backOffLimit:          this.backOffLimit,
          activeDeadlineSeconds: this.activeDeadlineSeconds,
          restartPolicy:         'never'
        };

        this.$emit('input', spec);
      } else {
        const spec = {
          ...this.value,
          failedJobsHistoryLimit:     this.failedJobsHistoryLimit,
          successfulJobsHistoryLimit: this.successfulJobsHistoryLimit,
          suspend:                    this.suspend,
          schedule:                   this.schedule,
          jobTemplate:                {
            ...this.value.jobTemplate,
            completions:           this.completions,
            parallelism:           this.parallelism,
            backOffLimit:          this.backOffLimit,
            activeDeadlineSeconds: this.activeDeadlineSeconds
          }
        };

        this.$emit('input', spec);
      }
    }
  }
};
</script>

<template>
  <form @input="update">
    <div class="row">
      <div class="col span-6">
        <UnitInput v-model="completions" :suffix="completions===1 ? 'Time' : 'Times'">
          <template v-slot:label>
            <span :style="{'color':'var(--input-label)'}">
              Completions
              <i v-tooltip="'The number of successfully finished pods the job should be run with.'" class="icon icon-info" style="font-size: 14px" />
            </span>
          </template>
        </UnitInput>
      </div>
      <div class="col span-6">
        <UnitInput v-model="parallelism" class="col span-6" :suffix="parallelism===1 ? 'Time' : 'Times'">
          <template v-slot:label>
            <span :style="{'color':'var(--input-label)'}">
              Parallelism
              <i v-tooltip="'The maximum number of pods the job should run at any given time.'" class="icon icon-info" style="font-size: 14px" />
            </span>
          </template>
        </UnitInput>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <UnitInput v-model="backOffLimit" :suffix="backOffLimit===1 ? 'Time' : 'Times'">
          <template v-slot:label>
            <span :style="{'color':'var(--input-label)'}">
              Back Off Limit
              <i v-tooltip="'The number of retries before marking this job failed.'" class="icon icon-info" style="font-size: 14px" />
            </span>
          </template>
        </UnitInput>
      </div>
      <div class="col span-6">
        <UnitInput v-model="activeDeadlineSeconds" :suffix="activeDeadlineSeconds===1 ? 'Second' : 'Seconds'">
          <template v-slot:label>
            <span :style="{'color':'var(--input-label)'}">
              Active Deadline
              <i v-tooltip="'The duration that the job may be active before the system tries to terminate it.'" class="icon icon-info" style="font-size: 14px" />
            </span>
          </template>
        </UnitInput>
      </div>
    </div>
    <template v-if="isCronJob">
      <div class="row">
        <div class="col span-6">
          <LabeledInput v-model="successfulJobsHistoryLimit">
            <template v-slot:label>
              <span :style="{'color':'var(--input-label)'}">
                Successful Job History Limit
                <i v-tooltip="'The number of successful finished jobs to retain.'" class="icon icon-info" style="font-size: 14px" />
              </span>
            </template>
          </LabeledInput>
        </div>
        <div class="col span-6">
          <LabeledInput v-model="failedJobsHistoryLimit">
            <template v-slot:label>
              <span :style="{'color':'var(--input-label)'}">
                Failed Job History Limit
                <i v-tooltip="'The number of failed finished jobs to retain.'" class="icon icon-info" style="font-size: 14px" />
              </span>
            </template>
          </LabeledInput>
        </div>
      </div>
      <span>Suspend</span>
      <RadioGroup v-model="suspend" row :options="[true, false]" :labels="['Yes', 'No']" />
    </template>
  </form>
</template>
