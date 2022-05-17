<script>
import { LabeledInput } from '@pkg/rancher-components/src/components/Form/LabeledInput';

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
