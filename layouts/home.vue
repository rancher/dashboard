<script>
import Header from '@/components/nav/Header';
import Brand from '@/mixins/brand';
import FixedBanner from '@/components/FixedBanner';

export default {

  components: { Header, FixedBanner },

  mixins: [Brand],

  middleware: ['authenticated'],

  data() {
    return {
      // Assume home pages have routes where the name is the key to use for string lookup
      name: this.$route.name
    };
  },

};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner />
    <div class="dashboard-content">
      <Header :simple="true" />

      <main>
        <nuxt class="outlet" />
      </main>
    </div>
    <FixedBanner :footer="true" />
  </div>
</template>

<style lang="scss" scoped>
  .dashboard-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .dashboard-content {
    display: grid;
    flex-grow:1;

    grid-template-areas:
      "header"
      "main";

    grid-template-columns: auto;
    grid-template-rows:    var(--header-height) auto;

    > HEADER {
      grid-area: header;
    }
  }

  MAIN {
    grid-area: main;
    overflow: auto;

    .outlet {
      min-height: 100%;
      padding: 0;
    }
  }
</style>
