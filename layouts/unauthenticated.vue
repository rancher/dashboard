<script>
import Brand from '@/mixins/brand';
import FixedBanner from '@/components/FixedBanner';
import ConsentBanner from '@/components/ConsentBanner';

export default {
  mixins:     [Brand],
  components: { FixedBanner, ConsentBanner }
};
</script>

<template>
  <main>
    <div class="dashboard-root">
      <FixedBanner />
      <ConsentBanner />
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
