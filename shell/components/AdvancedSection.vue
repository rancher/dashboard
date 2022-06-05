<script>
export default {
  props: {
    mode: {
      type:     String,
      required: true,
    },
  },

  data() {
    return { show: false };
  },

  methods: {
    toggle() {
      this.show = !this.show;
    },
  }
};
</script>

<template>
  <div class="mt-20">
    <a v-t="show ? 'generic.hideAdvanced' : 'generic.showAdvanced'" class="hand block" :class="{'mb-10': show}" @click="toggle" />

    <slot v-if="show" />
  </div>
</template>
