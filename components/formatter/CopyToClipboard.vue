<script>
import CopyToClipboardText from '@/components/CopyToClipboardText';

export default {
  components: { CopyToClipboardText },

  props: {
    value: {
      type:    String,
      default: ''
    },
  }
};
</script>

<template>
  <CopyToClipboardText :text="value" />
</template>
