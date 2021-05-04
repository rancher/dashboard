<script>
import Brand from '@/mixins/brand';

export default { mixins: [Brand] };
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
