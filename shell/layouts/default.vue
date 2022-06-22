<script>
import debounce from 'lodash/debounce';
import { mapState, mapGetters } from 'vuex';
import { mapPref, DEV, FAVORITE_TYPES, AFTER_LOGIN_ROUTE } from '@shell/store/prefs';
import ActionMenu from '@shell/components/ActionMenu';
import GrowlManager from '@shell/components/GrowlManager';
import WindowManager from '@shell/components/nav/WindowManager';
import PromptRemove from '@shell/components/PromptRemove';
import PromptRestore from '@shell/components/PromptRestore';
import PromptModal from '@shell/components/PromptModal';
import AssignTo from '@shell/components/AssignTo';
import Group from '@shell/components/nav/Group';
import Header from '@shell/components/nav/Header';
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';
import AwsComplianceBanner from '@shell/components/AwsComplianceBanner';
import AzureWarning from '@shell/components/auth/AzureWarning';
import {
  COUNT, SCHEMA, MANAGEMENT, UI, CATALOG, HCI
} from '@shell/config/types';
import { BASIC, FAVORITE, USED } from '@shell/store/type-map';
import { addObjects, replaceWith, clear, addObject } from '@shell/utils/array';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { NAME as NAVLINKS } from '@shell/config/product/navlinks';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/product/harvester-manager';
import isEqual from 'lodash/isEqual';
import { ucFirst } from '@shell/utils/string';
import { getVersionInfo, markSeenReleaseNotes } from '@shell/utils/version';
import { sortBy } from '@shell/utils/sort';
import PageHeaderActions from '@shell/mixins/page-actions';
import BrowserTabVisibility from '@shell/mixins/browser-tab-visibility';

const SET_LOGIN_ACTION = 'set-as-login';

export default {

  components: {
    PromptRemove,
    PromptRestore,
    AssignTo,
    PromptModal,
    Header,
    ActionMenu,
    Group,
    GrowlManager,
    WindowManager,
    FixedBanner,
    AwsComplianceBanner,
    AzureWarning
  },

  mixins: [PageHeaderActions, Brand, BrowserTabVisibility],

  data() {
    return {
      groups:         [],
      gettingGroups:  false,
      wantNavSync:    false
    };
  },

  middleware: ['authenticated'],

  computed: {
    ...mapState(['managementReady', 'clusterReady']),
    ...mapGetters(['productId', 'clusterId', 'namespaceMode', 'isExplorer', 'currentProduct', 'isSingleProduct']),
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

    showClusterTools() {
      return this.isExplorer &&
             this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO) &&
             this.$store.getters['cluster/canList'](CATALOG.APP);
    },

    displayVersion() {
      let { displayVersion } = getVersionInfo(this.$store);

      if (this.isVirtualProduct && this.isSingleProduct) {
        const setting = this.$store.getters['harvester/byId'](HCI.SETTING, 'server-version');

        displayVersion = setting?.value || 'unknown';
      }

      return displayVersion;
    },

    showProductFooter() {
      if (this.isVirtualProduct) {
        return true;
      } else {
        return false;
      }
    },

    isVirtualProduct() {
      return this.$store.getters['currentProduct'].name === HARVESTER;
    },

    supportLink() {
      const product = this.$store.getters['currentProduct'];

      if (product?.supportRoute) {
        return { ...product.supportRoute, params: { ...product.supportRoute.params, cluster: this.clusterId } };
      }

      return { name: `c-cluster-${ product?.name }-support` };
    },

  },

  watch: {
    counts() {
      this.queueUpdate();
    },

    allSchemas() {
      this.queueUpdate();
    },

    allNavLinks() {
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
    this.queueUpdate = debounce(this.getGroups, 500);

    this.getGroups();

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

    collapseAll() {
      this.$refs.groups.forEach((grp) => {
        grp.isExpanded = false;
      });
    },

    getGroups() {
      if ( this.gettingGroups ) {
        return;
      }
      this.gettingGroups = true;

      if ( !this.clusterReady ) {
        clear(this.groups);
        this.gettingGroups = false;

        return;
      }

      const clusterId = this.$store.getters['clusterId'];
      const currentProduct = this.$store.getters['productId'];
      const currentType = this.$route.params.resource || '';
      let namespaces = null;

      // TODO fix for harvester?
      if ( !this.$store.getters['isAllNamespaces'] ) {
        namespaces = Object.keys(this.namespaces);
      }

      // Always show cluster-level types, regardless of the namespace filter
      const namespaceMode = 'both';
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

        if ( productId === NAVLINKS ) {
          // Navlinks produce their own top-level nav items so don't need to show it as a product.
          continue;
        }

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

      if ( this.isExplorer ) {
        const allNavLinks = this.allNavLinks;
        const toAdd = [];
        const haveGroup = {};

        for ( const obj of allNavLinks ) {
          if ( !obj.link ) {
            continue;
          }

          const groupLabel = obj.spec.group;
          const groupSlug = obj.normalizedGroup;

          const entry = {
            name:        `link-${ obj._key }`,
            link:        obj.link,
            target:      obj.actualTarget,
            label:       obj.labelDisplay,
            sideLabel:   obj.spec.sideLabel,
            iconSrc:     obj.spec.iconSrc,
            description: obj.spec.description,
          };

          // If there's a spec.group (groupLabel), all entries with that name go under one nav group
          if ( groupSlug ) {
            if ( haveGroup[groupSlug] ) {
              continue;
            }

            haveGroup[groupSlug] = true;

            toAdd.push({
              name:     `navlink-group-${ groupSlug }`,
              label:    groupLabel,
              isRoot:   true,
              // This is the item that actually shows up in the nav, since this outer group will be invisible
              children: [
                {
                  name:  `navlink-child-${ groupSlug }`,
                  label: groupLabel,
                  route: {
                    name:   'c-cluster-navlinks-group',
                    params: {
                      cluster: this.clusterId,
                      group:   groupSlug,
                    }
                  },
                }
              ],
              weight: -100,
            });
          } else {
            toAdd.push({
              name:       `navlink-${ entry.name }`,
              label:      entry.label,
              isRoot:     true,
              // This is the item that actually shows up in the nav, since this outer group will be invisible
              children:   [entry],
              weight:     -100,
            });
          }
        }

        addObjects(out, toAdd);
      }

      replaceWith(this.groups, ...sortBy(out, ['weight:desc', 'label']));
      this.gettingGroups = false;
    },

    toggleNoneLocale() {
      this.$store.dispatch('i18n/toggleNone');
    },

    toggleTheme() {
      this.$store.dispatch('prefs/toggleTheme');
    },

    groupSelected(selected) {
      this.$refs.groups.forEach((grp) => {
        if (grp.canCollapse) {
          grp.isExpanded = (grp.group.name === selected.name);
        }
      });
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
    <AwsComplianceBanner />
    <AzureWarning />
    <div v-if="managementReady" class="dashboard-content">
      <Header />
      <nav v-if="clusterReady" class="side-nav">
        <div class="nav">
          <template v-for="(g) in groups">
            <Group
              ref="groups"
              :key="g.name"
              id-prefix=""
              class="package"
              :group="g"
              :can-collapse="!g.isRoot"
              :show-header="!g.isRoot"
              @selected="groupSelected($event)"
              @expand="groupSelected($event)"
            />
          </template>
        </div>
        <n-link v-if="showClusterTools" tag="div" class="tools" :to="{name: 'c-cluster-explorer-tools', params: {cluster: clusterId}}">
          <a class="tools-button" @click="collapseAll()">
            <i class="icon icon-gear" />
            <span>{{ t('nav.clusterTools') }}</span>
          </a>
        </n-link>
        <div v-if="showProductFooter" class="footer">
          <nuxt-link
            :to="supportLink"
            class="pull-right"
          >
            {{ t('nav.support', {hasSupport: true}) }}
          </nuxt-link>

          <span
            v-tooltip="{content: displayVersion, placement: 'top'}"
            class="clip version text-muted"
          >
            {{ displayVersion }}
          </span>

          <span v-if="isSingleProduct">
            <v-popover
              popover-class="localeSelector"
              placement="top"
              trigger="click"
            >
              <a
                data-testid="locale-selector"
                class="locale-chooser"
              >
                {{ locale }}
              </a>

              <template slot="popover">
                <ul class="list-unstyled dropdown" style="margin: -1px;">
                  <li
                    v-for="(label, name) in availableLocales"
                    :key="name"
                    class="hand"
                    @click="switchLocale(name)"
                  >
                    {{ label }}
                  </li>
                </ul>
              </template>
            </v-popover>
          </span>
        </div>
        <div v-else class="version text-muted">
          {{ displayVersion }}
        </div>
      </nav>
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
      <main v-if="!clusterId">
        <!-- Always ensure there's an outlet to cover 404 cases get directed to error page -->
        <nuxt class="outlet" />
      </main>
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

    NAV .footer {
      margin: 20px;

      display: flex;
      flex: 0;
      flex-direction: row;
      > * {
        flex: 1;
        color: var(--link);

        &:last-child {
          text-align: right;
        }

        &:first-child {
          text-align: left;
        }

        text-align: center;
      }

      .version {
        cursor: default;
        margin: 0px;
      }

      .locale-chooser {
        cursor: pointer;
      }
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
