<script>
import ActionMenu from '@shell/components/ActionMenu';
import Header from '@shell/components/nav/Header';
import PromptRemove from '@shell/components/PromptRemove';
import AssignTo from '@shell/components/AssignTo';
import IndentedPanel from '@shell/components/IndentedPanel';
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';
import GrowlManager from '@shell/components/GrowlManager';

export default {

  components: {
    ActionMenu,
    AssignTo,
    Header,
    IndentedPanel,
    PromptRemove,
    FixedBanner,
    GrowlManager
  },

  middleware: ['authenticated'],

  mixins: [Brand],

  data() {
    return {
      // Assume home pages have routes where the name is the key to use for string lookup
      name: this.$route.name,
    };
  },

};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner :header="true" />

    <div class="dashboard-content">
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

    <FixedBanner :footer="true" />
    <GrowlManager />
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
    flex-grow: 1;

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
