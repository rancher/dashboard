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
