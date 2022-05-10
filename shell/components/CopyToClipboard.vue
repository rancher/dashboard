<script>
import AsyncButton from '@shell/components/AsyncButton';

export default {
  components: { AsyncButton },

  props: {
    text: {
      type:     String,
      required: true,
    },

    showLabel: {
      type:    Boolean,
      default: true,
    }
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
    :show-label="showLabel"
    action-label="Copy"
    waiting-label="Copying..."
    success-label="Copied!"
    error-label="Error Copying"
    v-bind="$attrs"
    :delay="2000"
    @click="clicked"
  />
</template>
