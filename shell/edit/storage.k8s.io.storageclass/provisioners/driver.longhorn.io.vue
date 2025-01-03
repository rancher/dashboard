<script>
import KeyValue from '@shell/components/form/KeyValue';
import { _CREATE } from '@shell/config/query-params';

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
      this.value['parameters'] = {
        numberOfReplicas:    '3',
        staleReplicaTimeout: '2880',
        fromBackup:          null,
        diskSelector:        null,
        nodeSelector:        null,
        recurringJobs:       null
      };
    }

    return {};
  },
};
</script>
<template>
  <KeyValue
    v-model:value="value.parameters"
    :add-label="t('storageClass.longhorn.addLabel')"
    :read-allowed="false"
    :mode="mode"
  />
</template>
