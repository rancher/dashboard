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
  computed: {
    extensionData() {
      const panels = getApplicableExtensionEnhancements(this, this.type, this.location, this.$route);

      // Panels are ordered by `weight`, highest first. `weight` comes from a third party and
      // isn't type checked, so coerce it - anything that isn't a number counts as 0 rather than
      // making the comparison NaN, which would reorder other extensions' panels. The sort is
      // stable, so panels of equal weight keep the order the extension registered them in
      return panels.sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0));
    },
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
