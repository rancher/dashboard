<script>
import debounce from 'lodash/debounce';
import { mapState, mapGetters } from 'vuex';
import {
  mapPref, DEV, EXPANDED_GROUPS, FAVORITE_TYPES, AFTER_LOGIN_ROUTE
} from '@/store/prefs';
import ActionMenu from '@/components/ActionMenu';
import WindowManager from '@/components/nav/WindowManager';
import PromptRemove from '@/components/PromptRemove';
import AssignTo from '@/components/AssignTo';
import Group from '@/components/nav/Group';
import Header from '@/components/nav/Header';
import Brand from '@/mixins/brand';
import { COUNT, SCHEMA, MANAGEMENT } from '@/config/types';
import { BASIC, FAVORITE, USED } from '@/store/type-map';
import { addObjects, replaceWith, clear, addObject } from '@/utils/array';
import { NAME as EXPLORER } from '@/config/product/explorer';
import isEqual from 'lodash/isEqual';
import { ucFirst } from '@/utils/string';
import { getVersionInfo, markSeenReleaseNotes } from '@/utils/version';
import { sortBy } from '@/utils/sort';
import PageHeaderActions from '@/mixins/page-actions';

const SET_LOGIN_ACTION = 'set-as-login';

export default {

  components: {
    PromptRemove,
    AssignTo,
    Header,
    ActionMenu,
    Group,
    WindowManager
  },

  mixins: [PageHeaderActions, Brand],

  data() {
    const { displayVersion } = getVersionInfo(this.$store);

    return { groups: [], displayVersion };
  },

  middleware: ['authenticated'],

  computed: {
    ...mapState(['managementReady', 'clusterReady']),
    ...mapGetters(['productId', 'clusterId', 'namespaceMode', 'isExplorer', 'currentProduct']),
    ...mapGetters({ locale: 'i18n/selectedLocaleLabel' }),
    ...mapGetters('type-map', ['activeProducts']),

    afterLoginRoute: mapPref(AFTER_LOGIN_ROUTE),

    namespaces() {
      return this.$store.getters['namespaces']();
    },

    dev:            mapPref(DEV),
    expandedGroups: mapPref(EXPANDED_GROUPS),
    favoriteTypes:  mapPref(FAVORITE_TYPES),

    pageActions() {
      const pageActions = [];
      const product = this.$store.getters['currentProduct'];

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
    counts() {
      this.queueUpdate();
    },

    allSchemas() {
      this.queueUpdate();
    },

    favoriteTypes() {
      this.queueUpdate();
    },

    locale(a, b) {
      if ( !isEqual(a, b) ) {
        this.getGroups();
      }
    },

    productId(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    clusterId(a, b) {
      if ( !isEqual(a, b) ) {
        // Store the last visited route when the cluster changes
        this.setClusterAsLastRoute();
      }
    },

    namespaceMode(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    namespaces(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    clusterReady(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    product(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    async currentProduct(a, b) {
      if ( !isEqual(a, b) ) {
        if (a.inStore !== b.inStore || a.inStore !== 'cluster' ) {
          await this.$store.dispatch('prefs/setLastVisited', this.$route);
        }
      }
    }
  },

  async created() {
    this.queueUpdate = debounce(this.getGroups, 500);

    this.getGroups();

    await this.$store.dispatch('prefs/setLastVisited', this.$route);
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
      // Cluster Explorer
      if (this.currentProduct.inStore === 'cluster') {
        return {
          name:   'c-cluster-explorer',
          params: { cluster: this.clusterId }
        };
      }

      return this.$route;
    },

    collapseAll() {
      this.$refs.groups.forEach((grp) => {
        grp.isExpanded = false;
      });
    },

    getGroups() {
      if ( !this.clusterReady ) {
        clear(this.groups);

        return;
      }

      const clusterId = this.$store.getters['clusterId'];
      const currentProduct = this.$store.getters['productId'];
      const currentType = this.$route.params.resource || '';
      let namespaces = null;

      if ( !this.$store.getters['isAllNamespaces'] ) {
        namespaces = Object.keys(this.namespaces);
      }

      const namespaceMode = this.$store.getters['namespaceMode'];
      const out = [];
      const loadProducts = this.isExplorer ? [EXPLORER] : [];
      const productMap = this.activeProducts.reduce((acc, p) => {
        return { ...acc, [p.name]: p };
      }, {});

      if ( this.isExplorer ) {
        for ( const product of this.activeProducts ) {
          if ( product.inStore === 'cluster' ) {
            addObject(loadProducts, product.name);
          }
        }
      }

      // This should already have come into the list from above, but in case it hasn't...
      addObject(loadProducts, currentProduct);

      for ( const productId of loadProducts ) {
        const modes = [BASIC];

        if ( productId === EXPLORER ) {
          modes.push(FAVORITE);
          modes.push(USED);
        }

        for ( const mode of modes ) {
          const types = this.$store.getters['type-map/allTypes'](productId, mode) || {};
          const more = this.$store.getters['type-map/getTree'](productId, mode, types, clusterId, namespaceMode, namespaces, currentType);

          if ( productId === EXPLORER || !this.isExplorer ) {
            addObjects(out, more);
          } else {
            const root = more.find(x => x.name === 'root');
            const other = more.filter(x => x.name !== 'root');

            const group = {
              name:     productId,
              label:    this.$store.getters['i18n/withFallback'](`product.${ productId }`, null, ucFirst(productId)),
              children: [...(root?.children || []), ...other],
              weight:   productMap[productId]?.weight || 0,
            };

            addObject(out, group);
          }
        }
      }

      replaceWith(this.groups, ...sortBy(out, ['weight:desc', 'label']));
    },

    expanded(name) {
      const currentType = this.$route.params.resource || '';

      return name === currentType;
    },

    toggleNoneLocale() {
      this.$store.dispatch('i18n/toggleNone');
    },

    toggleTheme() {
      this.$store.dispatch('prefs/toggleTheme');
    },

    toggle(id, expanded, skip) {
      if (expanded && !skip) {
        this.$refs.groups.forEach((grp) => {
          if (grp.id !== id && grp.canCollapse) {
            grp.isExpanded = false;
          }
        });
      }
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
    }
  },

};
</script>

<template>
  <div v-if="managementReady" class="dashboard-root">
    <Header />

    <nav v-if="clusterReady" class="side-nav">
      <div class="nav">
        <template v-for="(g, idx) in groups">
          <Group
            ref="groups"
            :key="idx"
            id-prefix=""
            class="package"
            :expanded="expanded"
            :group="g"
            :can-collapse="!g.isRoot"
            :show-header="!g.isRoot"
            @on-toggle="toggle"
          >
            <template #header>
              <h6>{{ g.label }}</h6>
            </template>
          </Group>
        </template>
      </div>
      <n-link v-if="isExplorer" tag="div" class="tools" :to="{name: 'c-cluster-explorer-tools'}">
        <a class="tools-button" @click="collapseAll()">
          <i class="icon icon-gear" />
          <span>{{ t('nav.clusterTools') }}</span>
        </a>
      </n-link>
      <div class="version text-muted">
        {{ displayVersion }}
      </div>
    </nav>

    <main v-if="clusterReady">
      <nuxt class="outlet" />

      <ActionMenu />
      <PromptRemove />
      <AssignTo />
      <button v-if="dev" v-shortkey.once="['shift','l']" class="hide" @shortkey="toggleNoneLocale()" />
      <button v-if="dev" v-shortkey.once="['shift','t']" class="hide" @shortkey="toggleTheme()" />
      <button v-shortkey.once="['f8']" class="hide" @shortkey="wheresMyDebugger()" />
      <button v-shortkey.once="['`']" class="hide" @shortkey="toggleShell" />
    </main>

    <div class="wm">
      <WindowManager />
    </div>
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
  .dashboard-root {
    display: grid;
    height: 100vh;

    grid-template-areas:
      "header  header"
      "nav      main"
      "wm       wm";

    grid-template-columns: var(--nav-width)     auto;
    grid-template-rows:    var(--header-height) auto  var(--wm-height, 0px);

    > HEADER {
      grid-area: header;
    }

    NAV {
      grid-area: nav;
      position: relative;
      background-color: var(--nav-bg);
      border-right: var(--nav-border-size) solid var(--nav-border);
      overflow-y: auto;

      H6, .root.child .label {
        margin: 0;
        letter-spacing: normal;
        line-height: initial;

        A { padding-left: 0; }
      }
    }

    NAV .tools {
      display: flex;
      margin: 10px;
      text-align: center;

      A {
        align-items: center;
        border: 1px solid var(--border);
        border-radius: 5px;
        color: var(--body-text);
        display: flex;
        justify-content: center;
        outline: 0;
        flex: 1;
        padding: 10px;

        &:hover {
          background: var(--nav-hover);
          text-decoration: none;
        }

        > I {
          margin-right: 4px;
        }
      }

      &.nuxt-link-active:not(:hover) {
        A {
          background-color: var(--nav-active);
        }
      }
    }

    NAV .version {
      cursor: default;
      margin: 0 10px 10px 10px;
    }
  }

  MAIN {
    grid-area: main;
    overflow: auto;

    .outlet {
      display: flex;
      flex-direction: column;
      padding: 20px;
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
  }
</style>
