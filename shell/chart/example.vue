<script>
import { LabeledInput } from '@rc/Form/LabeledInput';

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
  <LabeledInput v-model:value="value.foo" />
</template>
