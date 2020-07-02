<script>
export default {
  data() {
    return { active: null };
  }
};
</script>

<template>
  <section
    v-show="active"
    :aria-hidden="!active"
    role="tabpanel"
  >
    <slot />
  </section>
</template>
