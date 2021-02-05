<script>
import KeyValue from '@/components/form/KeyValue';

export default {
  components: { KeyValue },
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
    return { parameters: {} };
  },
};
</script>
<template>
  <KeyValue v-model="value.parameters" :add-label="t('storageClass.custom.addLabel')" :read-allowed="false" :mode="mode" />
</template>
