<script>
export default {
  props: {
    label: {
      type:     String,
      required: true,
    },
    name: {
      type:     String,
      required: true,
    },
    weight: {
      type:     Number,
      default:  0,
      required: false,
    },
    canToggle: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return { active: null };
  }

};
</script>

<template>
  <section
    v-show="active"
    :id="name"
    :aria-hidden="!active"
    role="tabpanel"
  >
    <slot />
  </section>
</template>
