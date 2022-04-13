<script>
import ArrayList from '@shell/components/form/ArrayList';
import Select from '@shell/components/form/Select';

export default {
  components: { ArrayList, Select },
  props:      {
    value: {
      type:     Array,
      required: true
    },
    options: {
      default:   null,
      type:      Array
    },
    selectProps: {
      type:    Object,
      default: null,
    },
    arrayListProps: {
      type:    Object,
      default: null
    },
    loading: {
      type:    Boolean,
      default: false
    }
  },
  computed:   {
    filteredOptions() {
      return this.options
        .filter(option => !this.value.includes(option.value));
    },

    addAllowed() {
      return this.filteredOptions.length > 0;
    }
  },

  methods: {
    updateRow(index, value) {
      this.value.splice(index, 1, value);
      this.$emit(value);
    },
    calculateOptions(value) {
      const valueOption = this.options.find(o => o.value === value);

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
    @input="$emit('input', $event)"
  >
    <template v-slot:columns="scope">
      <Select :value="scope.row.value" v-bind="selectProps" :options="calculateOptions(scope.row.value)" @input="updateRow(scope.i, $event)" />
    </template>
  </ArrayList>
</template>

<style lang="scss" scoped>
::v-deep .unlabeled-select {
    height: 61px;
}
</style>
