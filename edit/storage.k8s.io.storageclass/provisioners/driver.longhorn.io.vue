<script>
import KeyValue from '@/components/form/KeyValue';
import { _CREATE } from '@/config/query-params';

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
    if (this.mode === _CREATE) {
      this.$set(this.value, 'parameters', {
        numberOfReplicas:    '3',
        staleReplicaTimeout: '2880',
        fromBackup:          '',
        diskSelector:        '',
        nodeSelector:        '',
        recurringJobs:       '',
      });
    }

    return {};
  },
};
</script>
<template>
  <KeyValue v-model="value.parameters" :add-label="t('storageClass.longhorn.addLabel')" :read-allowed="false" :mode="mode" />
</template>
