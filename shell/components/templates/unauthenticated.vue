<script>
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';

export default {
  mixins:     [Brand],
  components: { FixedBanner }
};
</script>

<template>
  <main class="main-layout">
    <div class="dashboard-root">
      <FixedBanner :header="true" />
      <FixedBanner :consent="true" />
      <router-view :key="$route.path" />
      <FixedBanner :footer="true" />
    </div>
  </main>
</template>

<style lang="scss" scoped>
main {
  height: 100vh;
}
</style>
