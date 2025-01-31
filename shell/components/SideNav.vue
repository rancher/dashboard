<script>
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { mapGetters, mapState } from 'vuex';
import {
  mapPref,
  FAVORITE_TYPES
} from '@shell/store/prefs';
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

export default {
  name:       'SideNav',
  components: { Group, LocaleSelector },
  data() {
    return {
      groups:        [],
      gettingGroups: false
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

      replaceWith(this.groups, ...sortBy(out, ['weight:desc', 'label']));

      this.gettingGroups = false;
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

    groupSelected(selected) {
      this.$refs.groups.forEach((grp) => {
        if (grp.canCollapse) {
          grp.isExpanded = (grp.group.name === selected.name);
        }
      });
    },

    collapseAll() {
      this.$refs.groups.forEach((grp) => {
        grp.isExpanded = false;
      });
    },

    syncNav() {
      const refs = this.$refs.groups;

      if (refs) {
        // Only expand one group - so after the first has been expanded, no more will
        // This prevents the 'More Resources' group being expanded in addition to the normal group
        let canExpand = true;
        const expanded = refs.filter((grp) => grp.isExpanded)[0];

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
  },
};
</script>

<template>
  <nav class="side-nav">
    <!-- Actual nav -->
    <div class="nav">
      <template
        v-for="(g) in groups"
        :key="g.name"
      >
        <Group
          ref="groups"
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
