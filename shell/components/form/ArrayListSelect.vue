<script>
import ArrayList from '@shell/components/form/ArrayList';
import Select from '@shell/components/form/Select';

export default {
  emits: ['update:value'],

  components: { ArrayList, Select },
  props:      {
    value: {
      type:     Array,
      required: true
    },
    options: {
      default: null,
      type:    Array
    },
    selectProps: {
      type:    Object,
      default: null,
    },
    arrayListProps: {
      type:    Object,
      default: null
    },
    enableDefaultAddValue: {
      type:    Boolean,
      default: true
    },
    loading: {
      type:    Boolean,
      default: false
    },
    disabled: {
      type:    Boolean,
      default: true
    }
  },
  computed: {
    filteredOptions() {
      return this.options
        .filter((option) => !this.value.includes(option.value));
    },

    addAllowed() {
      return this.arrayListProps?.addAllowed || this.filteredOptions.length > 0;
    },

    defaultAddValue() {
      return this.enableDefaultAddValue ? this.options[0]?.value : '';
    },

    getOptionLabel() {
      return this.selectProps?.getOptionLabel ? (opt) => (this.selectProps?.getOptionLabel(opt) || opt) : undefined;
    }
  },

  methods: {
    updateRow(index, value) {
      this.value.splice(index, 1, value);
      this.$emit('update:value', this.value);
    },
    calculateOptions(value) {
      const valueOption = this.options.find((o) => o.value === value);

      if (valueOption) {
        return [valueOption, ...this.filteredOptions];
      }

      return this.filteredOptions;
    }
  }
};
</script>

<template>
  <ArrayList
    v-bind="arrayListProps"
    :value="value"
    class="array-list-select"
    :add-allowed="addAllowed || loading"
    :loading="loading"
    :defaultAddValue="defaultAddValue"
    :disabled="disabled"
    @update:value="$emit('update:value', $event)"
  >
    <template v-slot:columns="scope">
      <Select
        :value="scope.row.value"
        v-bind="selectProps"
        :options="calculateOptions(scope.row.value)"
        :get-option-label="getOptionLabel"
        @update:value="updateRow(scope.i, $event)"
      />
    </template>
  </ArrayList>
</template>

<style lang="scss" scoped>
:deep() .unlabeled-select {
  height: 61px;
  }
</style>
