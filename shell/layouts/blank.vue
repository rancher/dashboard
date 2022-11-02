<script>
import Brand from '@shell/mixins/brand';
import AutoLogout from '@shell/mixins/auto-logout';

export default {
  middleware: ['authenticated'],
  mixins:     [Brand, AutoLogout],
};
</script>

<template>
  <main>
    <nuxt />
  </main>
</template>

<style lang="scss" scoped>
</style>
