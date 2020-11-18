<script>
import LabeledInput from '@/components/form/LabeledInput';
import UnitInput from '@/components/form/UnitInput';

export default {
  components: { LabeledInput, UnitInput },

  props: {
    spec: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
    concurrency: {
      type:    Number,
      default: null
    }
  },

  data() {
    if ( !this.spec.rollout ) {
      this.$set(this.spec, 'rollout', { pause: false });
    }

    return {};
  },
};
</script>
<template>
  <div>
    <div v-if="concurrency" class="row">
      <div class="col span-6">
        <LabeledInput
          key="concurrency"
          v-model.number="spec.autoscale.concurrency"
          :mode="mode"
          type="number"
          min="0"
          label="Concurrency"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          key="increment"
          v-model.number="spec.rollout.increment"
          :mode="mode"
          type="number"
          min="1"
          label="Rollout Increment"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model.number="spec.rollout.intervalSeconds"
          :mode="mode"
          label="Rollout Interval"
          :suffix="t('suffix.sec')"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabeledInput
          key="maxUnavailable"
          v-model.number="spec.maxUnavailable"
          :mode="mode"
          type="number"
          min="0"
          label="Max Unavailable"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          key="maxSurge"
          v-model.number="spec.maxSurge"
          :mode="mode"
          type="number"
          min="0"
          label="Max Surge"
        />
      </div>
    </div>
  </div>
</template>
