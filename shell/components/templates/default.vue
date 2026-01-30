<script>
import { mapState, mapGetters } from 'vuex';
import {
  mapPref,
  AFTER_LOGIN_ROUTE,
  THEME_SHORTCUT
} from '@shell/store/prefs';
import ActionMenu from '@shell/components/ActionMenu';
import GrowlManager from '@shell/components/GrowlManager';
import ModalManager from '@shell/components/ModalManager';
import SlideInPanelManager from '@shell/components/SlideInPanelManager';
import WindowManager from '@shell/components/nav/WindowManager';
import PromptRemove from '@shell/components/PromptRemove';
import PromptRestore from '@shell/components/PromptRestore';
import PromptModal from '@shell/components/PromptModal';
import Header from '@shell/components/nav/Header';
import Inactivity from '@shell/components/Inactivity';
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';
import AwsComplianceBanner from '@shell/components/AwsComplianceBanner';
import { MANAGEMENT } from '@shell/config/types';
import { markSeenReleaseNotes } from '@shell/utils/version';
import PageHeaderActions from '@shell/mixins/page-actions';
import BrowserTabVisibility from '@shell/mixins/browser-tab-visibility';
import { getClusterFromRoute, getProductFromRoute } from '@shell/utils/router';
import SideNav from '@shell/components/SideNav';
import { Layout } from '@shell/types/window-manager';
import { BLANK_CLUSTER } from 'store/store-types';

const SET_LOGIN_ACTION = 'set-as-login';

export default {

  components: {
    PromptRemove,
    PromptRestore,
    PromptModal,
    Header,
    ActionMenu,
    GrowlManager,
    ModalManager,
    SlideInPanelManager,
    WindowManager,
    FixedBanner,
    AwsComplianceBanner,
    Inactivity,
    SideNav,
  },

  mixins: [PageHeaderActions, Brand, BrowserTabVisibility],

  // Note - This will not run on route change
  data() {
    return {
      layout:           Layout.default,
      noLocaleShortcut: process.env.dev || false,
      wantNavSync:      false,
    };
  },

  // Note - These will run on route change
  computed: {
    ...mapState(['managementReady', 'clusterReady']),
    ...mapGetters(['clusterId', 'currentProduct', 'rootProduct', 'isRancherInHarvester', 'showTopLevelMenu']),

    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),

    themeShortcut: mapPref(THEME_SHORTCUT),

    pageActions() {
      const pageActions = [];
      const product = this.rootProduct;

      if ( !product ) {
        return [];
      }

      // Only show for Cluster Explorer or Global Apps (not configuration)
      const canSetAsHome = product.inStore === 'cluster' || (product.inStore === 'management' && product.category !== 'configuration') || this.isRancherInHarvester;

      if (canSetAsHome) {
        pageActions.push({
          label:  this.t('nav.header.setLoginPage'),
          action: SET_LOGIN_ACTION
        });
      }

      return pageActions;
    },

    unmatchedRoute() {
      return !this.$route?.matched?.length;
    },

    /**
     * Product config specifies what vuex store is being used by type-map to generate its side nav, generally "management" or "cluster"
     * If the current product or root product are using a "cluster" store, this component will re-render the main outlet when clusterReady is toggled
     * clusterReady will also be used if the route contains a cluster param (excluding the blank cluster workaround: _)
     */
    typemapStoreReady() {
      const currentInStore = this.currentProduct?.inStore;
      const rootInStore = this.rootProduct?.inStore;
      const clusterInRoute = !!getClusterFromRoute(this.$route) && getClusterFromRoute(this.$route) !== BLANK_CLUSTER;

      if (currentInStore === 'cluster' || rootInStore === 'cluster' || clusterInRoute) {
        return this.clusterReady;
      }

      return this.managementReady;
    },

    /**
     * When navigation involves unloading one cluster and loading another, clusterReady toggles from true->false->true in middleware (before new route content renders)
     * Prevent rendering "outlet" until the route changes to avoid re-rendering old route content after its cluster is unloaded

     */
    clusterAndRouteReady() {
      const targetRoute = this.$store.getters['targetRoute'];
      const routeReady = targetRoute ? this.currentProduct?.name === getProductFromRoute(this.$route) && this.currentProduct?.name === getProductFromRoute(targetRoute) : this.currentProduct?.name === getProductFromRoute(this.$route);

      return routeReady && this.typemapStoreReady;
    },
  },

  methods: {

    handlePageAction(action) {
      if (action.action === SET_LOGIN_ACTION) {
        this.afterLoginRoute = this.getLoginRoute();
        // Mark release notes as seen, so that the login route is honoured
        markSeenReleaseNotes(this.$store);
      }
    },

    getLoginRoute() {
      return {
        name:   this.$route.name,
        params: this.$route.params
      };
    },

    toggleNoneLocale() {
      this.$store.dispatch('i18n/toggleNone');
    },

    toggleTheme() {
      this.$store.dispatch('prefs/toggleTheme');
    },

    wheresMyDebugger() {
      // vue-shortkey is preventing F8 from passing through to the browser... this works for now.
      // eslint-disable-next-line no-debugger
      debugger;
    },

    async toggleShell() {
      const clusterId = this.$route.params.cluster;

      if ( !clusterId ) {
        return;
      }

      const cluster = await this.$store.dispatch('management/find', {
        type: MANAGEMENT.CLUSTER,
        id:   clusterId,
      });

      if (!cluster ) {
        return;
      }

      cluster.openShell();
    },
  }
};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner :header="true" />
    <AwsComplianceBanner v-if="managementReady" />
    <div
      v-if="managementReady"
      class="dashboard-content"
      :class="{'dashboard-padding-left': showTopLevelMenu}"
    >
      <Header />
      <SideNav
        v-if="typemapStoreReady"
        class="default-side-nav"
      />
      <main
        v-if="clusterAndRouteReady"
        class="main-layout"
        :aria-label="t('layouts.default')"
      >
        <router-view
          :key="$route.path"
          class="outlet"
        />
        <ActionMenu />
        <PromptRemove />
        <PromptRestore />
        <PromptModal />
        <ModalManager />
        <button
          v-if="noLocaleShortcut"
          v-shortkey.once="['shift','l']"
          class="hide"
          @shortkey="toggleNoneLocale()"
        />
        <button
          v-if="themeShortcut"
          v-shortkey.once="['shift','t']"
          class="hide"
          @shortkey="toggleTheme()"
        />
        <button
          v-shortkey.once="['f8']"
          class="hide"
          @shortkey="wheresMyDebugger()"
        />
        <button
          v-shortkey.once="['`']"
          class="hide"
          @shortkey="toggleShell"
        />
      </main>
      <!-- Ensure there's an outlet to show the error (404) page -->
      <main
        v-else-if="unmatchedRoute"
        class="main-layout"
        :aria-label="t('layouts.default')"
      >
        <router-view
          :key="$route.path"
          class="outlet"
        />
      </main>
      <WindowManager :layout="layout" />
    </div>
    <FixedBanner :footer="true" />
    <GrowlManager />
    <SlideInPanelManager />
    <Inactivity />
  </div>
</template>
