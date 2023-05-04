<script>
import Brand from '@shell/mixins/brand';
import Inactivity from '@shell/components/Inactivity';

export default {
  components: { Inactivity },
  middleware: ['authenticated'],
  mixins:     [Brand],
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
