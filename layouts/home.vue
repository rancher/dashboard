<script>
import Header from '@/components/nav/Header';
import Brand from '@/mixins/brand';

export default {

  components: { Header },

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
    <Header :simple="true" />

    <main>
      <nuxt class="outlet" />
    </main>
  </div>
</template>

<style lang="scss" scoped>
  .dashboard-root {
    display: grid;
    height: 100vh;

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
