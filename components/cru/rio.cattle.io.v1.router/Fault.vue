<script>
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
export default {
  components: { UnitInput, LabeledInput },
  props:      {
    spec: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const { percentage = null, delayMillis = null, abortHTTPStatus = null } = this.spec;

    return {
      percentage, delayMillis, abortHTTPStatus
    };
  },
  methods:    {
    change() {
      const { percentage, delayMillis, abortHTTPStatus } = this;

      this.$emit('input', {
        percentage, delayMillis, abortHTTPStatus: parseInt(abortHTTPStatus)
      } );
    }
  }
};
</script>

<template>
  <div class="row inputs" @input="change">
    <UnitInput
      v-model="percentage"
      label="Fault Percentage"
      :increment="1"
      :input-exponent="0"
      suffix="%"
      placeholder="Default: None"
    />
    <UnitInput
      v-model="delayMillis"
      label="Fault Delay"
      :increment="1"
      :input-exponent="0"
      suffix="ms"
    />
    <LabeledInput v-model="abortHTTPStatus" label="Fault HTTP Abort Code" type="number" />
  </div>
</template>
