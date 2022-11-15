<script>
import Select from '@shell/components/form/Select';
import UnitInput from '@shell/components/form/UnitInput';
import { ROW_COMPUTED } from './shared';

export default {
  components: { Select, UnitInput },

  props: {
    mode: {
      type:     String,
      required: true,
    },
    types: {
      type:    Array,
      default: () => []
    },
    type: {
      type:    String,
      default: ''
    },
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  computed: { ...ROW_COMPUTED },

  methods: {
    updateType(type) {
      if (typeof this.value.spec.resourceQuota.limit[this.type] !== 'undefined') {
        this.$delete(this.value.spec.resourceQuota.limit, this.type);
      }

      if (typeof this.value.spec.namespaceDefaultResourceQuota.limit[this.type] !== 'undefined') {
        this.$delete(this.value.spec.namespaceDefaultResourceQuota.limit, this.type);
      }

      this.$emit('type-change', type);
    }
  },
};
</script>
<template>
  <div
    v-if="typeOption"
    class="row"
  >
    <Select
      class="mr-10"
      :mode="mode"
      :value="type"
      :options="types"
      @input="updateType($event)"
    />
    <UnitInput
      v-model="value.spec.resourceQuota.limit[type]"
      class="mr-10"
      :mode="mode"
      :placeholder="typeOption.placeholder"
      :increment="typeOption.increment"
      :input-exponent="typeOption.inputExponent"
      :base-unit="typeOption.baseUnit"
      :output-modifier="true"
    />
    <UnitInput
      v-model="value.spec.namespaceDefaultResourceQuota.limit[type]"
      :mode="mode"
      :placeholder="typeOption.placeholder"
      :increment="typeOption.increment"
      :input-exponent="typeOption.inputExponent"
      :base-unit="typeOption.baseUnit"
      :output-modifier="true"
    />
  </div>
</template>

<style lang='scss' scoped>
  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
  }
</style>
