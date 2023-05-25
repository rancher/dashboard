<script>
export default {
  props: {
    mode: {
      type:     String,
      required: true,
    },
    isOpenByDefault: {
      // It may be useful to keep the advanced options open
      // if the form is in edit mode and it has non-default
      // advanced options configured.
      type:    Boolean,
      default: false
    }
  },

  data(props) {
    return { show: props.isOpenByDefault };
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
    <a
      v-t="show ? 'generic.hideAdvanced' : 'generic.showAdvanced'"
      class="hand block"
      :class="{'mb-10': show}"
      @click="toggle"
    />

    <slot v-if="show" />
  </div>
</template>
