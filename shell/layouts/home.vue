<script>
import Header from '@shell/components/nav/Header';
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';
import GrowlManager from '@shell/components/GrowlManager';
import { mapPref, DEV } from '@shell/store/prefs';
import AwsComplianceBanner from '@shell/components/AwsComplianceBanner';
import AzureWarning from '@shell/components/auth/AzureWarning';
import BrowserTabVisibility from '@shell/mixins/browser-tab-visibility';
import { mapState } from 'vuex';

export default {

  components: {
    Header,
    FixedBanner,
    GrowlManager,
    AzureWarning,
    AwsComplianceBanner
  },

  mixins: [Brand, BrowserTabVisibility],

  middleware: ['authenticated'],

  data() {
    return {
      // Assume home pages have routes where the name is the key to use for string lookup
      name: this.$route.name
    };
  },

  computed: {
    dev: mapPref(DEV),
    ...mapState(['managementReady']),
  },

  methods: {
    toggleTheme() {
      this.$store.dispatch('prefs/toggleTheme');
    },
  }

};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner :header="true" />
    <AwsComplianceBanner />
    <AzureWarning />

    <div class="dashboard-content">
      <Header v-if="managementReady" :simple="true" />

      <main>
        <nuxt class="outlet" />
      </main>
    </div>
    <FixedBanner :footer="true" />
    <GrowlManager />
    <button v-if="dev" v-shortkey.once="['shift','t']" class="hide" @shortkey="toggleTheme()" />
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
