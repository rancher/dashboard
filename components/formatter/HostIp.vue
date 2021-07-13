<script>
import CopyToClipboardText from '@/components/CopyToClipboardText';

export default {
  components: { CopyToClipboardText },
  props:      {
    value: {
      type:     String,
      default: ''
    },
  },

  computed: {
    ip() {
      return this.value;
    }
  },
};
</script>

<template>
  <CopyToClipboardText v-if="ip" :text="ip" />
</template>
