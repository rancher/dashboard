import { createApp } from 'vue';

export default createApp({
  props: {
    compact: {
      type:    Boolean,
      default: null
    },
    label: {
      type:    String,
      default: null
    },

    labelKey: {
      type:    String,
      default: null
    },
  },

  computed: {
    isCompact(): boolean {
      // Compact if explicitly set - otherwise compact if there is no label
      return this.compact !== null ? this.compact : !(this.label || this.labelKey);
    }
  }
});
