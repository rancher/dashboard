<script>
import Brand from '@/mixins/brand';
import FixedBanner from '@/components/FixedBanner';

export default {
  mixins:     [Brand],
  components: { FixedBanner }
};
</script>

<template>
  <main>
    <div class="dashboard-root">
      <FixedBanner />
      <nuxt />
      <FixedBanner :footer="true" />
    </div>
  </main>
</template>

<style lang="scss" scoped>
main {
  height: 100vh;
}
</style>
