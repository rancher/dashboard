
<script>
export default {
  head() {
    const theme = this.$store.getters['prefs/theme'];

    return {
      bodyAttrs: { class: `theme-${ theme } dashboard-body` },
      title:     'Dashboard',
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
main {
  height: 100vh;
}
</style>
