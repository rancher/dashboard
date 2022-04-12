<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import RadioGroup from '@shell/components/form/RadioGroup';

export default {
  components: { LabeledInput, RadioGroup },
  props:      {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  },
  data() {
    return {
      availabilityZoneOptions: [
        {
          label: this.t('storageClass.cinder.availabilityZone.automatic'),
          value: 'automatic'
        },
        {
          label: this.t('storageClass.cinder.availabilityZone.manual.label'),
          value: 'manual'
        }
      ],
      availabilityZone: this.value.parameters.availability ? 'manual' : 'automatic'
    };
  },
  watch: {
    availabilityZone() {
      this.$set(this.value.parameters, 'availability', '');
    }
  }
};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput v-model="value.parameters.type" :placeholder="t('storageClass.cinder.volumeType.placeholder')" :label="t('storageClass.cinder.volumeType.label')" :mode="mode" />
      </div>
      <div class="col span-6">
        <RadioGroup v-model="availabilityZone" name="availability-zone" :options="availabilityZoneOptions" :label="t('storageClass.cinder.availabilityZone.label')" :mode="mode" />
        <LabeledInput
          v-if="availabilityZone === 'manual'"
          v-model="value.parameters.availability"
          class="mt-10"
          :placeholder="t('storageClass.cinder.availabilityZone.manual.placeholder')"
          :label="t('storageClass.cinder.availabilityZone.manual.label')"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
