<script>
import Brand from '@/mixins/brand';
import FixedBanner from '@/components/FixedBanner';

export default {
  components: { FixedBanner },
  mixins:     [Brand]
};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner />
    <main>
      <nuxt />
    </main>
    <FixedBanner :footer="true" />
  </div>
</template>

<style lang="scss" scoped>
  .dashboard-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  main {
    height: 100%;
  }
</style>
