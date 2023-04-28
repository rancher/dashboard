<script>
import Brand from '@shell/mixins/brand';
import Inactivity from '@shell/components/Inactivity';

export default {
  middleware: ['authenticated'],
  mixins:     [Brand, Inactivity],
};
</script>

<template>
  <main class="main-layout">
    <nuxt />
  </main>
</template>

<style lang="scss" scoped>
</style>
