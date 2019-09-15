
<script>
import { THEME } from '@/store/prefs';

export default {
  head() {
    const theme = this.$store.getters['prefs/get'](THEME);

    return { bodyAttrs: { class: `theme-${ theme }` } };
  },
};
</script>

<template>
  <main>
    <nuxt />
  </main>
</template>

<style lang="scss" scoped>
</style>
