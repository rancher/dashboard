<script>
import RuleSelector from '@/components/form/RuleSelector';
import { _VIEW } from '@/config/query-params';

export default {
  components: { RuleSelector },

  props: {
    value: {
      type:    Array,
      default: null
    },
    mode: {
      type:    String,
      default: _VIEW
    }
  },

  data() {
    return {
      operatorOptions: [

        {
          label: 'is set',
          value: 'Exists',
        },
        {
          label: 'is not set',
          value: 'DoesNotExist',
        },
        {
          label: 'in list',
          value: 'In',
        },
        {
          label: 'not in list',
          value: 'NotIn',
        },
      ]
    };
  },

  computed: {
    localValue: {
      get() {
        return this.value;
      },
      set(localValue) {
        this.$emit('input', localValue);
      }
    }
  }
};
</script>

<template>
  <RuleSelector
    v-model="localValue"
    :operator-options="operatorOptions"
    key-header="Namespace key"
    operator-header="Namespace operator"
    value-header="Namespace value"
    add-label="Add Namespace"
    :mode="mode"
  />
</template>
