
<script>
import { THEME } from '@/store/prefs';

export default {
  middleware: ['authenticated'],

  head() {
    const theme = this.$store.getters['prefs/get'](THEME);

    return {
      bodyAttrs: { class: `theme-${ theme }` },
      title:     'Rio Dashboard',
    };
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
