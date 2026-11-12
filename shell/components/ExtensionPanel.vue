<script>
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';

export default {
  name:  'ExtensionPanel',
  props: {
    resource: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    type: {
      type:    String,
      default: ''
    },
    location: {
      type:    String,
      default: ''
    },
  },
  data() {
    const panels = getApplicableExtensionEnhancements(this, this.type, this.location, this.$route);

    // Panels are ordered by `weight`, highest first. The sort is stable, so panels sharing a
    // weight keep the order they were added in
    return { extensionData: [...panels].sort((a, b) => (b.weight || 0) - (a.weight || 0)) };
  },
};
</script>

<template>
  <div
    v-if="extensionData.length"
  >
    <div
      v-for="item, i in extensionData"
      :key="`extensionData${location}${i}`"
    >
      <component
        :is="item.component"
        :resource="resource"
      />
    </div>
  </div>
</template>
