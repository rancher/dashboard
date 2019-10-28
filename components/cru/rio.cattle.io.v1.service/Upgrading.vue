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
    }
  },

  data() {
    if ( !this.spec.rollout ) {
      this.spec.rollout = {};
    }

    return {};
  }
};
</script>
<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          key="increment"
          v-model="spec.weight"
          :mode="mode"
          type="number"
          min="0"
          label="Weight"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          key="increment"
          v-model="spec.rollout.increment"
          :mode="mode"
          type="number"
          min="1"
          label="Rollout Increment"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model="spec.rollout.interval"
          :mode="mode"
          label="Rollout Interval"
          suffix="sec"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <LabeledInput
          key="maxUnavailable"
          v-model="spec.maxUnavailable"
          :mode="mode"
          type="number"
          min="0"
          label="Max Unavailable"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          key="maxSurge"
          v-model="spec.maxSurge"
          :mode="mode"
          type="number"
          min="0"
          label="Max Surge"
        />
      </div>
    </div>
  </div>
</template>
