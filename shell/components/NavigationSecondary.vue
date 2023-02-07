<script>
import { mapState, mapGetters } from 'vuex';
import { SCHEMA, COUNT, CATALOG, UI } from '@shell/config/types';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { getVersionInfo } from '@shell/utils/version';
import Group from '@shell/components/nav/Group';
import { replaceWith, clear, addObject, addObjects } from '@shell/utils/array';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { sortBy } from '@shell/utils/sort';
import { BASIC, FAVORITE, USED } from '@shell/store/type-map';
import { NAME as NAVLINKS } from '@shell/config/product/navlinks';
import { ucFirst } from '@shell/utils/string';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { mapPref, FAVORITE_TYPES } from '@shell/store/prefs';

export default {
  components: { Group },
  computed:   {
    ...mapState(['managementReady', 'clusterReady']),
    ...mapGetters(['productId', 'clusterId', 'isSingleProduct', 'isExplorer', 'namespaceMode']),
    ...mapGetters({ locale: 'i18n/selectedLocaleLabel', availableLocales: 'i18n/availableLocales' }),
    ...mapGetters('type-map', ['activeProducts']),

    showClusterTools() {
      return this.isExplorer &&
             this.$store.getters['cluster/canList'](CATALOG.CLUSTER_REPO) &&
             this.$store.getters['cluster/canList'](CATALOG.APP);
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

    displayVersion() {
      if (this.isSingleProduct?.getVersionInfo) {
        return this.isSingleProduct?.getVersionInfo(this.$store);
      }

      const { displayVersion } = getVersionInfo(this.$store);

      return displayVersion;
    },

    allNavLinks() {
      if ( !this.clusterId || !this.$store.getters['cluster/schemaFor'](UI.NAV_LINK) ) {
        return [];
      }

      return this.$store.getters['cluster/all'](UI.NAV_LINK);
    },

    counts() {
      const managementReady = this.managementReady;
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

    allSchemas() {
      const managementReady = this.managementReady;
      const product = this.$store.getters['currentProduct'];

      if ( !managementReady || !product ) {
        return [];
      }

      return this.$store.getters[`${ product.inStore }/all`](SCHEMA);
    },

    namespaces() {
      return this.$store.getters['activeNamespaceCache'];
    },

    favoriteTypes: mapPref(FAVORITE_TYPES),
  },
  watch: {
    counts(a, b) {
      if ( a !== b ) {
        this.queueUpdate();
      }
    },

    allSchemas(a, b) {
      if ( a !== b ) {
        this.queueUpdate();
      }
    },

    allNavLinks(a, b) {
      if ( a !== b ) {
        this.queueUpdate();
      }
    },

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

    productId(a, b) {
      if ( !isEqual(a, b) ) {
        // Immediately update because you'll see it come in later
        this.getGroups();
      }
    },

    $route(a, b) {
      this.$nextTick(() => this.syncNav());
    },
  },
  mounted() {
    // Sync the navigation tree on fresh load
    this.$nextTick(() => this.syncNav());
  },
  created() {
    this.queueUpdate = debounce(this.getGroups, 500);

    this.getGroups();
  },
  data() {
    return {
      groups:        [],
      gettingGroups: false,
    };
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
      let namespaces = null;

      if ( !this.$store.getters['isAllNamespaces'] ) {
        const namespacesObject = this.$store.getters['namespaces']();

        namespaces = Object.keys(namespacesObject);
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

      this.getProductsGroups(out, loadProducts, namespaceMode, namespaces, productMap);
      this.getExplorerGroups(out);

      replaceWith(this.groups, ...sortBy(out, ['weight:desc', 'label']));
      this.gettingGroups = false;
    },

    getProductsGroups(out, loadProducts, namespaceMode, namespaces, productMap) {
      const clusterId = this.$store.getters['clusterId'];
      const currentType = this.$route.params.resource || '';

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
      this.$refs.groups.forEach((grp) => {
        grp.isExpanded = false;
      });
    },

    groupSelected(selected) {
      this.$refs.groups.forEach((grp) => {
        if (grp.canCollapse) {
          grp.isExpanded = (grp.group.name === selected.name);
        }
      });
    },

    switchLocale(locale) {
      this.$store.dispatch('i18n/switchTo', locale);
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
  }
};
</script>

<template>
  <nav
    v-if="clusterReady"
    class="side-nav"
  >
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
    <n-link
      v-if="showClusterTools"
      tag="div"
      class="tools"
      :to="{name: 'c-cluster-explorer-tools', params: {cluster: clusterId}}"
    >
      <a
        class="tools-button"
        @click="collapseAll()"
      >
        <i class="icon icon-gear" />
        <span>{{ t('nav.clusterTools') }}</span>
      </a>
    </n-link>
    <div
      v-if="showProductFooter"
      class="footer"
    >
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
            <ul
              class="list-unstyled dropdown"
              style="margin: -1px;"
            >
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
    <div
      v-else
      class="version text-muted"
    >
      {{ displayVersion }}
    </div>
  </nav>
</template>

<style lang="scss" scoped>
  ::v-deep > .package H6, .package .root.child .label {
    margin: 0;
    letter-spacing: normal;
    line-height: initial;

    A { padding-left: 0; }
  }

  NAV {
    position: relative;
    background-color: var(--nav-bg);
    border-right: var(--nav-border-size) solid var(--nav-border);
    overflow-y: auto;
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

  .side-nav {
    display: flex;
    flex-direction: column;
    min-width: var(--nav-width);
    .nav {
      flex: 1;
      overflow-y: auto;
    }
  }

</style>
