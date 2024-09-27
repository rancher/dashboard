<script>
import Labels from '@shell/components/form/Labels';
import Tab from '@shell/components/Tabbed/Tab';

export default {
  emits: ['update:value', 'input'],

  components: { Labels, Tab },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
  },
  computed: {
    localValue: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit('update:value', newValue);
      }
    },
  },
};
</script>

<template>
  <Tab
    name="labels"
    label-key="generic.labelsAndAnnotations"
  >
    <Labels
      v-model:value="localValue"
      :mode="mode"
      :display-side-by-side="false"
      @input="$emit('input', $event)"
    />
  </Tab>
</template>
