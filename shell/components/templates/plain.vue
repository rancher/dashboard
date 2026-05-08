<script>
import { mapPref, THEME_SHORTCUT } from '@shell/store/prefs';
import ActionMenu from '@shell/components/ActionMenu';
import Header from '@shell/components/nav/Header';
import PromptRemove from '@shell/components/PromptRemove';
import IndentedPanel from '@shell/components/IndentedPanel';
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';
import GrowlManager from '@shell/components/GrowlManager';
import ModalManager from '@shell/components/ModalManager';
import SlideInPanelManager from '@shell/components/SlideInPanelManager';
import AwsComplianceBanner from '@shell/components/AwsComplianceBanner';
import AzureWarning from '@shell/components/auth/AzureWarning';
import BrowserTabVisibility from '@shell/mixins/browser-tab-visibility';
import Inactivity from '@shell/components/Inactivity';
import { mapGetters } from 'vuex';
import PromptModal from '@shell/components/PromptModal';
import { Layout } from '@shell/types/window-manager';

export default {

  components: {
    ActionMenu,
    Header,
    IndentedPanel,
    PromptRemove,
    PromptModal,
    FixedBanner,
    GrowlManager,
    ModalManager,
    SlideInPanelManager,
    AwsComplianceBanner,
    AzureWarning,
    Inactivity,
  },

  mixins: [Brand, BrowserTabVisibility],

  inject: ['notifyWmContainerReady'],

  data() {
    return {
      // Assume home pages have routes where the name is the key to use for string lookup
      name:             this.$route.name,
      noLocaleShortcut: process.env.dev || false
    };
  },

  computed: {
    themeShortcut: mapPref(THEME_SHORTCUT),
    ...mapGetters(['showTopLevelMenu']),
  },

  mounted() {
    this.notifyWmContainerReady(Layout.plain);
  },

  methods: {
    toggleTheme() {
      this.$store.dispatch('prefs/toggleTheme');
    },
    toggleNoneLocale() {
      this.$store.dispatch('i18n/toggleNone');
    },
  }
};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner :header="true" />
    <AwsComplianceBanner />
    <AzureWarning />

    <div
      class="dashboard-content"
      :class="{'dashboard-padding-left': showTopLevelMenu}"
    >
      <Header :simple="true" />
      <main
        class="main-layout"
        :aria-label="t('layouts.plain')"
      >
        <IndentedPanel class="pt-20">
          <router-view
            :key="$route.path"
            class="outlet"
          />
        </IndentedPanel>
        <ActionMenu />
        <PromptRemove />
        <PromptModal />
        <ModalManager />
        <button
          v-if="themeShortcut"
          v-shortkey.once="['shift','t']"
          class="hide"
          @shortkey="toggleTheme()"
        />
        <button
          v-if="noLocaleShortcut"
          v-shortkey.once="['shift','l']"
          class="hide"
          @shortkey="toggleNoneLocale()"
        />
      </main>
      <!-- Teleport target for WindowManager (unique per layout) -->
      <!-- display: contents makes child panels become grid items of the parent grid -->
      <div
        id="wm-container-plain"
        style="display: contents;"
      />
    </div>

    <FixedBanner :footer="true" />
    <GrowlManager />
    <SlideInPanelManager />
    <Inactivity />
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
      "header header header"
      "wm-vl  main   wm-vr";

    grid-template-columns: var(--wm-vl-width, 0px) auto var(--wm-vr-width, 0px);
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
