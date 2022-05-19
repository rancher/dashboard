<script>
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';

export default {
  mixins:     [Brand],
  components: { FixedBanner }
};
</script>

<template>
  <main>
    <div class="dashboard-root">
      <FixedBanner :header="true" />
      <FixedBanner :consent="true" />
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
