<script>
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },

  props: {
    value: {
      type:     Object,
      required: true,
    }
  }
};
</script>

<template>
  <LabeledInput v-model="value.foo" />
</template>
