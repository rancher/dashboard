<script>
import CopyToClipboard from '@/components/CopyToClipboard';

export default {
  components: { CopyToClipboard },
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
  <div>
    {{ ip }}<CopyToClipboard :text="ip" label-as="tooltip" class="icon-btn" action-color="bg-transparent" />
  </div>
</template>
