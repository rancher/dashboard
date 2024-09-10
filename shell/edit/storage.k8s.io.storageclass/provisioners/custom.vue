<script>
import KeyValue from '@shell/components/form/KeyValue';

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
  }
};
</script>
<template>
  <KeyValue
    v-model:value="value.parameters"
    :add-label="t('storageClass.custom.addLabel')"
    :read-allowed="false"
    :mode="mode"
  />
</template>
