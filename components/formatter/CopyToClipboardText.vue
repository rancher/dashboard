<script>
import CopyToClipboardText from '@/components/CopyToClipboardText';

export default {
  name:       'CopyToClipboardTextFormatter',
  components: { CopyToClipboardText },
  props:      {
    value: {
      type:     String,
      default: ''
    },
  }
};
</script>

<template>
  <CopyToClipboardText :text="value" />
</template>
