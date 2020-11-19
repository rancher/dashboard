<script>
import { _VIEW } from '@/config/query-params';
import LabeledSelect from '@/components/form/LabeledSelect';

export const SCOPE_OPTIONS = ['*', 'Cluster', 'Namespaced'];

export default {
  components: { LabeledSelect },

  props: {
    value: {
      type:    String,
      default: null
    },
    mode: {
      type:    String,
      default: _VIEW
    }
  },

  data() {
    return { SCOPE_OPTIONS };
  }
};
</script>

<template>
  <LabeledSelect :value="value" :mode="mode" :options="SCOPE_OPTIONS" @input="e=>$emit('input', e)" />
</template>
