<script>
import KeyValue from '@shell/components/form/KeyValue';

export default {
  emits: ['update:value'],

  components: { KeyValue },

  props: {
    // volumeAttributes
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },

  created() {
    const defaults = {
      numberOfReplicas: '3', size: '2Gi', staleReplicaTimeout: '20'
    };

    for (const key in defaults) {
      if (!this.value[key]) {
        this.value[key] = defaults[key];
      }
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-12">
      <KeyValue
        :value="value"
        :mode="mode"
        :as-map="true"
        @update:value="$emit('update:value', value)"
      />
    </div>
  </div>
</template>
