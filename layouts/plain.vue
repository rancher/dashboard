<script>
import { mapState } from 'vuex';
import Header from '@/components/nav/Header';
import Footer from '@/components/nav/Footer';

export default {

  components: {
    Header,
    Footer,
  },

  middleware: ['authenticated'],

  computed: { ...mapState(['managementReady', 'isRancher']) },

  head() {
    const theme = this.$store.getters['prefs/theme'];

    return {
      bodyAttrs: { class: `theme-${ theme } overflow-hidden dashboard-body` },
      title:     'Dashboard',
    };
  },

};
</script>

<template>
  <div class="dashboard-root">
    <Header />

    <main>
      <nuxt class="outlet" />
      <Footer />
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
      padding: 20px 20px 70px 20px;
      min-height: 100%;
      margin-bottom: calc(-1 * var(--footer-height) - 1px);
    }

    FOOTER {
      background-color: var(--nav-bg);
      height: var(--footer-height);
    }
  }
</style>
