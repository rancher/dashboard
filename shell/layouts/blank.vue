<script>
import Brand from '@shell/mixins/brand';

export default {
  middleware: ['authenticated'],
  mixins:     [Brand],
};
</script>

<template>
  <main class="main-layout">
    <nuxt />
  </main>
</template>

<style lang="scss" scoped>
</style>
