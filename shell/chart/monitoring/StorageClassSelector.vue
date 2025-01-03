<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  name: 'StorageClassSelector',

  emits: ['updateName'],

  components: { LabeledSelect },
  props:      {
    options: {
      type:    Array,
      default: () => {
        return [];
      },
    },

    value: {
      type:    String,
      default: '',
    },
  },
  methods: {
    createNewStorageClassName(newOption) {
      newOption = { metadata: { name: newOption } };

      return newOption;
    },
    updateName({ metadata: { name } }) {
      this.$emit('updateName', name);
    },
  },
};
</script>

<template>
  <LabeledSelect
    v-bind="$attrs"
    :value="value"
    option-key="metadata.name"
    option-label="metadata.name"
    :create-option="createNewStorageClassName"
    :localized-label="false"
    :options="options"
    :push-tags="true"
    :taggable="true"
    @update:value="updateName"
  />
</template>
