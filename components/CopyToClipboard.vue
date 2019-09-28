<script>
import AsyncButton from '@/components/AsyncButton';

export default {
  components: { AsyncButton },

  props: {
    text: {
      type:     String,
      required: true,
    },
  },

  methods: {
    clicked(buttonCb) {
      this.$copyText(this.text).then(() => {
        buttonCb(true);
      }).catch(() => {
        buttonCb(false);
      });
    },
  }
};
</script>

<template>
  <AsyncButton
    icon="icon-copy"
    action-label="Copy to Clipboard"
    waiting-label="Copying..."
    success-label="Copied!"
    error-label="Error Copying"
    @click="clicked"
  />
</template>
