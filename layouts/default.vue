<script>
import debounce from 'lodash/debounce';
import { mapState, mapGetters } from 'vuex';
import { mapPref, DEV, FAVORITE_TYPES, AFTER_LOGIN_ROUTE } from '@/store/prefs';
import ActionMenu from '@/components/ActionMenu';
import WindowManager from '@/components/nav/WindowManager';
import PromptRemove from '@/components/PromptRemove';
import PromptRestore from '@/components/PromptRestore';
import PromptModal from '@/components/PromptModal';
import AssignTo from '@/components/AssignTo';
import Header from '@/components/nav/Header';
import Brand from '@/mixins/brand';
import FixedBanner from '@/components/FixedBanner';
import GrowlManager from '@/components/GrowlManager';
import {
  COUNT, SCHEMA, MANAGEMENT, UI, CATALOG
} from '@/config/types';
import isEqual from 'lodash/isEqual';

import { markSeenReleaseNotes } from '@/utils/version';

import PageHeaderActions from '@/mixins/page-actions';
import SideNav from '@/components/nav/sideNav';

const SET_LOGIN_ACTION = 'set-as-login';

export default {

  components: {
    GrowlManager,
    PromptRemove,
    PromptRestore,
    AssignTo,
    PromptModal,
    Header,
    ActionMenu,
    WindowManager,
    FixedBanner,
    SideNav,
  },

  mixins: [PageHeaderActions, Brand],

  middleware: ['authenticated'],

  computed: {
    ...mapState(['managementReady', 'clusterReady']),
    ...mapGetters(['productId', 'clusterId', 'namespaceMode', 'isExplorer', 'currentProduct', 'isSingleVirtualCluster']),
    ...mapGetters({ locale: 'i18n/selectedLocaleLabel', availableLocales: 'i18n/availableLocales' }),
    ...mapGetters('type-map', ['activeProducts']),

    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),

    namespaces() {
      return this.$store.getters['namespaces']();
    },

    dev:            mapPref(DEV),
    favoriteTypes:  mapPref(FAVORITE_TYPES),

    pageActions() {
      const pageActions = [];
      const product = this.$store.getters['currentProduct'];

      if ( !product ) {
        return [];
      }

      // Only show for Cluster Explorer or Global Apps (not configuration)
      const canSetAsHome = product.inStore === 'cluster' || (product.inStore === 'management' && product.category !== 'configuration');

      if (canSetAsHome) {
        pageActions.push({
          labelKey: 'nav.header.setLoginPage',
          action:   SET_LOGIN_ACTION
        });
      }

      return pageActions;
    },

    allSchemas() {
      const managementReady = this.$store.getters['managementReady'];
      const product = this.$store.getters['currentProduct'];

      if ( !managementReady || !product ) {
        return [];
      }

      return this.$store.getters[`${ product.inStore }/all`](SCHEMA);
    },

    allNavLinks() {
      if ( !this.clusterId || !this.$store.getters['cluster/schemaFor'](UI.NAV_LINK) ) {
        return [];
      }

      return this.$store.getters['cluster/all'](UI.NAV_LINK);
    },

    counts() {
      const managementReady = this.$store.getters['managementReady'];
      const product = this.$store.getters['currentProduct'];

      if ( !managementReady || !product ) {
        return {};
      }

      const inStore = product.inStore;

      // So that there's something to watch for updates
      if ( this.$store.getters[`${ inStore }/haveAll`](COUNT) ) {
        const counts = this.$store.getters[`${ inStore }/all`](COUNT)[0].counts;

        return counts;
      }

      return {};
    },

  },

  watch: {
    async currentProduct(a, b) {
      if ( !isEqual(a, b) ) {
        if (a.inStore !== b.inStore || a.inStore !== 'cluster' ) {
          const route = {
            name:   'c-cluster-product',
            params: {
              cluster: this.clusterId,
              product: a.name,
            }
          };

          await this.$store.dispatch('prefs/setLastVisited', route);
        }
      }
    },

    $route(a, b) {
      this.$nextTick(() => this.syncNav());
    },

  },

  async created() {
    await this.$store.dispatch('prefs/setLastVisited', this.$route);
  },

  mounted() {
    // Sync the navigation tree on fresh load
    this.$nextTick(() => this.syncNav());
  },

  methods: {
    async setClusterAsLastRoute() {
      const route = {
        name:   this.$route.name,
        params: {
          ...this.$route.params,
          cluster: this.clusterId,
        }
      };

      await this.$store.dispatch('prefs/setLastVisited', route);
    },
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

    syncNav() {
      const refs = this.$refs.groups;

      if (refs) {
        // Only expand one group - so after the first has been expanded, no more will
        // This prevents the 'More Resources' group being expanded in addition to the normal group
        let canExpand = true;
        const expanded = refs.filter(grp => grp.isExpanded)[0];

        if (expanded && expanded.hasActiveRoute()) {
          this.$nextTick(() => expanded.syncNav());

          return;
        }
        refs.forEach((grp) => {
          if (!grp.group.isRoot) {
            grp.isExpanded = false;
            if (canExpand) {
              const isActive = grp.hasActiveRoute();

              if (isActive) {
                grp.isExpanded = true;
                canExpand = false;
                this.$nextTick(() => grp.syncNav());
              }
            }
          }
        });
      }
    },

    switchLocale(locale) {
      this.$store.dispatch('i18n/switchTo', locale);
    },
  }
};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner :header="true" />
    <div v-if="managementReady" class="dashboard-content">
      <Header />
      <SideNav :cluster-ready="clusterReady" />
      <main v-if="clusterReady">
        <nuxt class="outlet" />
        <ActionMenu />
        <PromptRemove />
        <PromptRestore />
        <AssignTo />
        <PromptModal />
        <button v-if="dev" v-shortkey.once="['shift','l']" class="hide" @shortkey="toggleNoneLocale()" />
        <button v-if="dev" v-shortkey.once="['shift','t']" class="hide" @shortkey="toggleTheme()" />
        <button v-shortkey.once="['f8']" class="hide" @shortkey="wheresMyDebugger()" />
        <button v-shortkey.once="['`']" class="hide" @shortkey="toggleShell" />
      </main>
      <div class="wm">
        <WindowManager />
      </div>
    </div>
    <FixedBanner :footer="true" />
    <GrowlManager />
  </div>
</template>
<style lang="scss" scoped>
  .side-nav {
    display: flex;
    flex-direction: column;
    .nav {
      flex: 1;
      overflow-y: auto;
    }
  }

</style>
<style lang="scss">
  .dashboard-root{
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .dashboard-content {
    display: grid;
    position: relative;
    flex: 1 1 auto;
    overflow-y: auto;
    min-height: 0px;

    grid-template-areas:
      "header  header"
      "nav      main"
      "wm       wm";

    grid-template-columns: var(--nav-width)     auto;
    grid-template-rows:    var(--header-height) auto  var(--wm-height, 0px);

    > HEADER {
      grid-area: header;
    }

  }

  MAIN {
    grid-area: main;
    overflow: auto;

    .outlet {
      display: flex;
      flex-direction: column;
      padding: $space-m;
      min-height: 100%;
    }

    FOOTER {
      background-color: var(--nav-bg);
      height: var(--footer-height);
    }

    HEADER {
      display: grid;
      grid-template-areas:  "type-banner type-banner"
                            "title actions"
                            "state-banner state-banner";
      grid-template-columns: auto auto;
      margin-bottom: 20px;
      align-content: center;
      min-height: 48px;

      .type-banner {
        grid-area: type-banner;
      }

      .state-banner {
        grid-area: state-banner;
      }

      .title {
        grid-area: title;
        align-self: center;
      }

      .actions-container {
        grid-area: actions;
        margin-left: 8px;
        align-self: center;
        text-align: right;
      }

      .role-multi-action {
        padding: 0 $input-padding-sm;
      }
    }
  }

  .wm {
    grid-area: wm;
    overflow-y: hidden;
    z-index: 1;
  }

  .localeSelector {
    ::v-deep .popover-inner {
      padding: 50px 0;
    }

    ::v-deep .popover-arrow {
      display: none;
    }

    ::v-deep .popover:focus {
      outline: 0;
    }

    li {
      padding: 8px 20px;

      &:hover {
        background-color: var(--primary-hover-bg);
        color: var(--primary-hover-text);
        text-decoration: none;
      }
    }
  }
</style>
