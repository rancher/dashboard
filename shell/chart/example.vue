<script>
import { LabeledInput } from '@rancher/components';

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
