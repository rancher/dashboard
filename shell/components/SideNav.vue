<script>
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { mapGetters, mapState, useStore } from 'vuex';
import {
  mapPref,
  FAVORITE_TYPES
} from '@shell/store/prefs';
import { useClusterLocalStorage } from '@shell/composables/useClusterLocalStorage';
import { getVersionInfo } from '@shell/utils/version';
import {
  addObjects, replaceWith, clear, addObject, sameContents
} from '@shell/utils/array';
import { sortBy } from '@shell/utils/sort';
import { ucFirst } from '@shell/utils/string';

import { HCI, UI, SCHEMA } from '@shell/config/types';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { TYPE_MODES } from '@shell/store/type-map';
import { NAME as NAVLINKS } from '@shell/config/product/navlinks';
import Group from '@shell/components/nav/Group';
import LocaleSelector from '@shell/components/LocaleSelector';
import NavActionBar from '@shell/components/nav/NavActionBar';

export default {
  name:       'SideNav',
  components: {
    Group, LocaleSelector, NavActionBar
  },
  setup() {
    const store = useStore();

    const explorerClusterId = () => (store.getters.isExplorer ? store.getters.clusterId : '');

    return { navStateStorage: useClusterLocalStorage('nav-group-state', explorerClusterId) };
  },
  data() {
    return {
      groups:        [],
      gettingGroups: false,
    };
  },

  created() {
    // Ensure that changes to resource that change often don't resort to spamming redraw of the side nav
    this.queueUpdate = debounce(this.getGroups, 500);

    this.getGroups();
  },

  mounted() {
    // Sync the navigation tree on fresh load
    this.$nextTick(() => this.syncNav());
  },

  watch: {

    /**
     * Keep this simple, we're only interested in new / removed schemas
     */
    allSchemasIds(a, b) {
      if ( !sameContents(a, b) ) {
        this.queueUpdate();
      }
    },

    allNavLinksIds(a, b) {
      if ( !sameContents(a, b) ) {
        this.queueUpdate();
      }
    },

    /**
     * Note - There's no watch on prefs, so this only catches in session changes
     */
    favoriteTypes(a, b) {
      if ( !isEqual(a, b) ) {
        this.queueUpdate();
      }
    },

    locale(a, b) {
      if ( !isEqual(a, b) ) {
        this.getGroups();
      }
    },

    // Queue namespaceMode and namespaces
    // Changes to namespaceMode can also change namespaces, so keep this simple and execute both in a shortened queue

    namespaceMode(a, b) {
      if ( a !== b ) {
        this.queueUpdate();
      }
    },

    namespaces(a, b) {
      if ( !isEqual(a, b) ) {
        this.queueUpdate();
      }
    },

    clusterReady(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    rootProduct(a, b) {
      if (a?.name !== b?.name) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    $route(a, b) {
      this.$nextTick(() => this.syncNav());
    },

  },

  computed: {
    ...mapState(['managementReady', 'clusterReady']),
    ...mapGetters(['isStandaloneHarvester', 'productId', 'clusterId', 'currentProduct', 'rootProduct', 'isSingleProduct', 'namespaceMode', 'isExplorer', 'isVirtualCluster']),
    ...mapGetters({ locale: 'i18n/selectedLocaleLabel', hasMultipleLocales: 'i18n/hasMultipleLocales' }),
    ...mapGetters('type-map', ['activeProducts']),

    favoriteTypes: mapPref(FAVORITE_TYPES),

    supportLink() {
      const product = this.rootProduct;

      if (product?.supportRoute) {
        return { ...product.supportRoute, params: { ...product.supportRoute.params, cluster: this.clusterId } };
      }

      return { name: `c-cluster-${ product?.name }-support` };
    },

    displayVersion() {
      if (this.isSingleProduct?.getVersionInfo) {
        return this.isSingleProduct?.getVersionInfo(this.$store);
      }
      const { displayVersion } = getVersionInfo(this.$store);

      return displayVersion;
    },

    singleProductAbout() {
      return this.isSingleProduct?.aboutPage;
    },

    harvesterVersion() {
      return this.$store.getters['cluster/byId'](HCI.SETTING, 'server-version')?.value || 'unknown';
    },

    showProductFooter() {
      if (this.isVirtualProduct) {
        return true;
      } else {
        return false;
      }
    },

    isVirtualProduct() {
      return this.rootProduct.name === HARVESTER;
    },

    allNavLinks() {
      if ( !this.clusterId || !this.$store.getters['cluster/schemaFor'](UI.NAV_LINK) ) {
        return [];
      }

      return this.$store.getters['cluster/all'](UI.NAV_LINK);
    },

    allSchemasIds() {
      const managementReady = this.managementReady;
      const product = this.currentProduct;

      if ( !managementReady || !product ) {
        return [];
      }

      // This does take some up-front time, however avoids an even more costly getGroups call
      return this.$store.getters[`${ product.inStore }/all`](SCHEMA).map((s) => s.id).sort();
    },

    namespaces() {
      return this.$store.getters['activeNamespaceCache'];
    },

    allNavLinksIds() {
      return this.allNavLinks.map((a) => a.id);
    },

    /**
     * Whether anything is expanded anywhere in the tree, which is what gates the
     * collapse-all control. Read from the tree rather than from the rendered
     * groups, so a group nested inside a collapsed parent still counts.
     */
    hasExpandedGroup() {
      let expanded = false;

      this.eachCollapsibleGroup(this.groups, (node) => {
        expanded = expanded || !!node.expanded;
      });

      return expanded;
    },
  },

  methods: {
    /**
     * Fetch navigation by creating groups from product schemas
     */
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

      const currentProduct = this.$store.getters['productId'];

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

      this.getProductsGroups(out, loadProducts, namespaceMode, productMap);

      this.getExplorerGroups(out);

      // If there's a root group, pull its children up to the top level
      // so that we can order them alongside group items in the nav
      const rootGroupIndex = out.findIndex((g) => g.name.toLowerCase() === 'root');
      const rootGroup = out[rootGroupIndex];

      if (rootGroup && rootGroup.children?.length) {
        out.splice(rootGroupIndex, 1);

        rootGroup.children.forEach((child) => {
          addObject(out, { ...child, children: [] });
        });
      }

      this.stampNavState(out);

      replaceWith(this.groups, ...sortBy(out, ['weight:desc', 'label']));

      this.gettingGroups = false;
    },

    /**
     * Visit every collapsible group in the tree, passing each node and the path
     * identifying it. Root groups (and everything under them) render fixed open,
     * so they have no expand state to track.
     *
     * The path matches the `id` Group builds for itself, because group names are
     * only unique among their siblings (`Networking` exists under both Istio and
     * More Resources, for example).
     */
    eachCollapsibleGroup(nodes, fn, prefix = '') {
      (nodes || []).forEach((node) => {
        if (node.isRoot || !node.children?.length) {
          return;
        }

        const path = prefix + node.name;

        fn(node, path);
        this.eachCollapsibleGroup(node.children, fn, `${ path }_`);
      });
    },

    // Stamp each group's saved expand/collapse state onto the tree so groups
    // render in their persisted state (the tree is the source of truth, see
    // Group's `isExpanded`). The whole tree is marked up front, so nested groups
    // restore in the same render pass as their parents.
    stampNavState(nodes) {
      const savedState = this.navStateStorage.load();

      if (!savedState) {
        return;
      }

      this.eachCollapsibleGroup(nodes, (node, path) => {
        if (savedState[path] !== undefined) {
          node.expanded = savedState[path];
        }
      });
    },

    getProductsGroups(out, loadProducts, namespaceMode, productMap) {
      const clusterId = this.$store.getters['clusterId'];
      const currentType = this.$route.params.resource || '';

      for ( const productId of loadProducts ) {
        const modes = [TYPE_MODES.BASIC];

        if ( productId === NAVLINKS ) {
          // Navlinks produce their own top-level nav items so don't need to show it as a product.
          continue;
        }

        if ( productId === EXPLORER ) {
          modes.push(TYPE_MODES.FAVORITE);
          modes.push(TYPE_MODES.USED);
        }

        // Get all types for all modes
        const typesByMode = this.$store.getters['type-map/allTypes'](productId, modes);

        for ( const mode of modes ) {
          const types = typesByMode[mode] || {};
          const more = this.$store.getters['type-map/getTree'](productId, mode, types, clusterId, namespaceMode, currentType);

          if ( productId === EXPLORER || !this.isExplorer ) {
            addObjects(out, more);
          } else {
            const root = more.find((x) => x.name === 'root');
            const other = more.filter((x) => x.name !== 'root');

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
    },

    getExplorerGroups(out) {
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
              name:     `navlink-${ entry.name }`,
              label:    entry.label,
              isRoot:   true,
              // This is the item that actually shows up in the nav, since this outer group will be invisible
              children: [entry],
              weight:   -100,
            });
          }
        }

        addObjects(out, toAdd);
      }
    },

    collapseAll() {
      this.eachCollapsibleGroup(this.groups, (node) => {
        node.expanded = false;
      });

      // Drop the persisted state rather than merging into it, so groups that
      // aren't in the tree right now are collapsed too (nothing stored for a
      // group means collapsed).
      this.navStateStorage.save({});

      // The collapse-all control hides once nothing is expanded, so move focus to
      // the first group header instead of dropping it to <body>. Only headers of
      // collapsible groups are focusable, so ask for one of those.
      this.$nextTick(() => {
        this.$el.querySelector('.nav .header[tabindex="0"]')?.focus();
      });
    },

    // Merge rather than replace, so groups that aren't in the tree right now keep
    // their state. `More Resources` subgroups are count driven, so they come and
    // go with the namespace filter.
    saveNavState() {
      const state = { ...(this.navStateStorage.load() || {}) };

      this.eachCollapsibleGroup(this.groups, (node, path) => {
        state[path] = !!node.expanded;
      });

      this.navStateStorage.save(state);
    },

    syncNav() {
      const refs = this.$refs.groups;

      if (!refs) {
        return;
      }

      let synced = false;

      refs.forEach((grp) => {
        if (!grp.group.isRoot && !synced && grp.hasActiveRoute()) {
          if (!grp.isExpanded) {
            grp.isExpanded = true;
          }
          synced = true;
          this.$nextTick(() => grp.syncNav());
        }
      });

      this.saveNavState();
    },

    /**
     * Emitted once a jump-to's navigation has settled, so the active item is
     * already rendered (or is about to be, once its groups expand). Syncing here
     * rather than leaning on the route watcher covers jumping to the section
     * already being shown, where the route never changes and so the watcher
     * never runs: without it, a jump back into a collapsed group does nothing.
     */
    onJumped() {
      this.syncNav();
      this.scrollActiveIntoView();
    },

    /**
     * Scroll the active nav item into view within the scrolling group list, once
     * it exists and is visible (i.e. after any ancestor groups have expanded).
     * Retries across a few frames so it fires after a jump-to reveals the target.
     */
    scrollActiveIntoView() {
      // Cancel any still-running attempt so overlapping jumps don't stack loops.
      if (this.scrollRaf) {
        cancelAnimationFrame(this.scrollRaf);
      }

      let tries = 0;
      const attempt = () => {
        const el = this.$el?.querySelector('.nav .router-link-exact-active') ||
          this.$el?.querySelector('.nav .router-link-active');

        // `offsetParent` is null while the item is still hidden in a collapsed
        // group; wait until it has rendered and become visible before scrolling.
        if (el && el.offsetParent !== null) {
          el.scrollIntoView({ block: 'nearest' });
          this.scrollRaf = null;
        } else if (tries++ < 30) {
          this.scrollRaf = requestAnimationFrame(attempt);
        } else {
          this.scrollRaf = null;
        }
      };

      this.scrollRaf = requestAnimationFrame(attempt);
    },
  },
};
</script>

<template>
  <nav
    class="side-nav"
    role="navigation"
    :aria-label="t('nav.ariaLabel.sideNav')"
  >
    <!-- Jump-to + collapse-all bar, pinned above the scrolling nav. The
         collapse-all control only appears while a group is expanded. -->
    <NavActionBar
      :groups="groups"
      :has-expanded-group="hasExpandedGroup"
      @collapse-all="collapseAll()"
      @jumped="onJumped"
    />
    <!-- Actual nav -->
    <div class="nav">
      <template
        v-for="(g) in groups"
        :key="`${ clusterId }/${ g.name }`"
      >
        <Group
          ref="groups"
          id-prefix=""
          class="package"
          :group="g"
          :can-collapse="!g.isRoot"
          :show-header="!g.isRoot"
          @expand="saveNavState()"
          @close="saveNavState()"
        />
      </template>
    </div>
    <!-- SideNav footer area (seems to be tied to harvester) -->
    <div
      v-if="showProductFooter"
      class="footer"
    >
      <!-- support link -->
      <router-link
        :to="supportLink"
        class="pull-right"
        role="link"
        :aria-label="t('nav.support', {hasSupport: true})"
      >
        {{ t('nav.support', {hasSupport: true}) }}
      </router-link>
      <!-- version number -->
      <span
        v-clean-tooltip="{content: displayVersion, placement: 'top'}"
        class="clip version text-muted"
      >
        {{ displayVersion }}
      </span>

      <!-- locale selector -->
      <LocaleSelector
        v-if="isSingleProduct && hasMultipleLocales && !isStandaloneHarvester"
        mode="login"
        :show-icon="false"
      />
    </div>
    <!-- SideNav footer alternative -->
    <div
      v-else
      class="version text-muted flex"
    >
      <router-link
        v-if="singleProductAbout"
        :to="singleProductAbout"
        role="link"
        :aria-label="t('nav.ariaLabel.productAboutPage')"
      >
        {{ displayVersion }}
      </router-link>
      <template v-else>
        <span
          v-if="isVirtualCluster && isExplorer"
          v-clean-tooltip="{content: harvesterVersion, placement: 'top'}"
          class="clip text-muted ml-5"
        >
          (Harvester-{{ harvesterVersion }})
        </span>
      </template>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
  .side-nav {
    display: flex;
    flex-direction: column;
    .nav {
      flex: 1;
      overflow-y: auto;
    }

    position: relative;
    background-color: var(--nav-bg);
    border-right: var(--nav-border-size) solid var(--nav-border);
    overflow-y: auto;

    // h6 is used in Group element
    :deep() h6 {
      margin: 0;
      letter-spacing: normal;
      line-height: 15px;

      A { padding-left: 0; }
    }

    .tools {
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

      &.router-link-active:not(:hover) {
        A {
          background-color: var(--nav-active);
        }
      }
    }

    .version {
      cursor: default;
      margin: 0 10px 10px 10px;
    }

    .footer {
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

  .flex {
    display: flex;
  }

</style>
