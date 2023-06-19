<script>
import Brand from '@shell/mixins/brand';
import AutoLogout from '@shell/mixins/auto-logout';
import Inactivity from '@shell/components/Inactivity';

export default {
  components: { Inactivity },
  middleware: ['authenticated'],
  mixins:     [Brand, AutoLogout],
};
</script>

<template>
  <main class="main-layout">
    <nuxt />

    <Inactivity />
  </main>
</template>

<style lang="scss" scoped>
</style>
