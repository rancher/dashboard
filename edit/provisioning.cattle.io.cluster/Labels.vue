<script>
import Labels from '@/components/form/Labels';
import Tab from '@/components/Tabbed/Tab';

export default {
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
};
</script>

<template>
  <Tab name="labels" label-key="generic.labelsAndAnnotations">
    <Labels
      v-model="value"
      :mode="mode"
      :display-side-by-side="false"
    />
  </Tab>
</template>
