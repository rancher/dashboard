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
    return { extensionData: getApplicableExtensionEnhancements(this, this.type, this.location, this.$route) };
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
