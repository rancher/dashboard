<script>
import Brand from '@shell/mixins/brand';

export default {
  middleware: ['authenticated'],
  mixins:     [Brand],
};
</script>

<template>
  <main>
    <nuxt />
  </main>
</template>

<style lang="scss" scoped>
</style>
