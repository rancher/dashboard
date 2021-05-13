<script>
import ActionMenu from '@/components/ActionMenu';
import Header from '@/components/nav/Header';
import PromptRemove from '@/components/PromptRemove';
import AssignTo from '@/components/AssignTo';
import IndentedPanel from '@/components/IndentedPanel';

export default {

  components: {
    ActionMenu,
    AssignTo,
    Header,
    IndentedPanel,
    PromptRemove
  },

  middleware: ['authenticated'],

  data() {
    return {
      // Assume home pages have routes where the name is the key to use for string lookup
      name: this.$route.name,
    };
  },

  head() {
    const theme = this.$store.getters['prefs/theme'];

    return {
      bodyAttrs: { class: `theme-${ theme } overflow-hidden dashboard-body` },
      title:     this.$store.getters['i18n/t']('nav.title'),
    };
  },

};
</script>

<template>
  <div class="dashboard-root">
    <Header :simple="true" />

    <main>
      <IndentedPanel class="pt-20">
        <nuxt class="outlet" />
      </IndentedPanel>
      <ActionMenu />
      <PromptRemove />
      <AssignTo />
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
