<script>
import BrandImage from '@shell/components/BrandImage';
import ClusterIconMenu from '@shell/components/ClusterIconMenu';
import IconOrSvg from '../IconOrSvg';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { mapGetters } from 'vuex';
import { CAPI, COUNT, MANAGEMENT } from '@shell/config/types';
import { MENU_MAX_CLUSTERS, PINNED_CLUSTERS } from '@shell/store/prefs';
import { sortBy } from '@shell/utils/sort';
import { ucFirst } from '@shell/utils/string';
import { KEY } from '@shell/utils/platform';
import { getVersionInfo } from '@shell/utils/version';
import { SETTING } from '@shell/config/settings';
import { getProductFromRoute } from '@shell/utils/router';
import { isRancherPrime } from '@shell/config/version';
import Pinned from '@shell/components/nav/Pinned';
import { getGlobalBannerFontSizes } from '@shell/utils/banners';
import { TopLevelMenuHelperPagination, TopLevelMenuHelperLegacy } from '@shell/components/nav/TopLevelMenu.helper';
import { debounce } from 'lodash';
import { sameContents } from '@shell/utils/array';

export default {
  components: {
    BrandImage,
    ClusterIconMenu,
    IconOrSvg,
    Pinned
  },

  data() {
    const { displayVersion, fullVersion } = getVersionInfo(this.$store);
    const hasProvCluster = this.$store.getters[`management/schemaFor`](CAPI.RANCHER_CLUSTER);

    const canPagination = this.$store.getters[`management/paginationEnabled`]({
      id:      MANAGEMENT.CLUSTER,
      context: 'side-bar',
    }) && this.$store.getters[`management/paginationEnabled`]({
      id:      CAPI.RANCHER_CLUSTER,
      context: 'side-bar',
    });
    const helper = canPagination ? new TopLevelMenuHelperPagination({ $store: this.$store }) : new TopLevelMenuHelperLegacy({ $store: this.$store });
    const provClusters = !canPagination && hasProvCluster ? this.$store.getters[`management/all`](CAPI.RANCHER_CLUSTER) : [];
    const mgmtClusters = !canPagination ? this.$store.getters[`management/all`](MANAGEMENT.CLUSTER) : [];

    if (!canPagination) {
      // Reduce the impact of the initial load, but only if we're not making a request
      const args = {
        pinnedIds:   this.pinnedIds,
        searchTerm:  this.search,
        unPinnedMax: this.maxClustersToShow
      };

      helper.update(args);
    }

    return {
      shown:             false,
      displayVersion,
      fullVersion,
      clusterFilter:     '',
      hasProvCluster,
      maxClustersToShow: MENU_MAX_CLUSTERS,
      emptyCluster:      BLANK_CLUSTER,
      routeCombo:        false,

      canPagination,
      helper,
      debouncedHelperUpdateSlow:   debounce((...args) => this.helper.update(...args), 1000),
      debouncedHelperUpdateMedium: debounce((...args) => this.helper.update(...args), 750),
      debouncedHelperUpdateQuick:  debounce((...args) => this.helper.update(...args), 200),
      provClusters,
      mgmtClusters,
    };
  },

  computed: {
    ...mapGetters(['clusterId']),
    ...mapGetters(['clusterReady', 'isRancher', 'currentCluster', 'currentProduct', 'isRancherInHarvester']),
    ...mapGetters({ features: 'features/get' }),

    pinnedIds() {
      return this.$store.getters['prefs/get'](PINNED_CLUSTERS);
    },

    sideMenuStyle() {
      const globalBannerSettings = getGlobalBannerFontSizes(this.$store);

      return {
        marginBottom: globalBannerSettings?.footerFont,
        marginTop:    globalBannerSettings?.headerFont
      };
    },

    showClusterSearch() {
      return this.allClustersCount > this.maxClustersToShow;
    },

    allClustersCount() {
      const counts = this.$store.getters[`management/all`](COUNT)?.[0]?.counts || {};
      const count = counts[MANAGEMENT.CLUSTER] || {};

      return count?.summary.count;
    },

    // New
    search() {
      return (this.clusterFilter || '').toLowerCase();
    },

    // New
    showPinClusters() {
      return !this.clusterFilter;
    },

    // New
    searchActive() {
      return !!this.search;
    },

    /**
     * Only Clusters that are pinned
     *
     * (see description of helper.clustersPinned for more details)
     */
    pinFiltered() {
      return this.hasProvCluster ? this.helper.clustersPinned : [];
    },

    /**
     * Used to shown unpinned clusters OR results of text search
     *
     * (see description of helper.clustersOthers for more details)
     */
    clustersFiltered() {
      return this.hasProvCluster ? this.helper.clustersOthers : [];
    },

    pinnedClustersHeight() {
      const pinCount = this.pinFiltered.length;
      const height = pinCount > 2 ? (pinCount * 43) : 90;

      return `min-height: ${ height }px`;
    },
    clusterFilterCount() {
      return this.clusterFilter ? this.clustersFiltered.length : this.allClustersCount;
    },

    multiClusterApps() {
      const options = this.options;

      return options.filter((opt) => {
        const filterApps = (opt.inStore === 'management' || opt.isMultiClusterApp) && opt.category !== 'configuration' && opt.category !== 'legacy';

        if (this.isRancherInHarvester) {
          return filterApps && opt.category !== 'hci';
        } else {
          // We expect the location of Virtualization Management to remain the same when rancher-manage-support is not enabled
          return filterApps;
        }
      });
    },

    configurationApps() {
      const options = this.options;

      return options.filter((opt) => opt.category === 'configuration');
    },

    hciApps() {
      const options = this.options;

      return options.filter((opt) => this.isRancherInHarvester && opt.category === 'hci');
    },

    options() {
      const cluster = this.clusterId || this.$store.getters['defaultClusterId'];

      // TODO plugin routes
      const entries = this.$store.getters['type-map/activeProducts']?.map((p) => {
        // Try product-specific index first
        const to = p.to || {
          name:   `c-cluster-${ p.name }`,
          params: { cluster }
        };

        const matched = this.$router.getRoutes().filter((route) => route.name === to.name);

        if ( !matched.length ) {
          to.name = 'c-cluster-product';
          to.params.product = p.name;
        }

        return {
          label:             this.$store.getters['i18n/withFallback'](`product."${ p.name }"`, null, ucFirst(p.name)),
          icon:              `icon-${ p.icon || 'copy' }`,
          svg:               p.svg,
          value:             p.name,
          removable:         p.removable !== false,
          inStore:           p.inStore || 'cluster',
          weight:            p.weight || 1,
          category:          p.category || 'none',
          to,
          isMultiClusterApp: p.isMultiClusterApp,
        };
      });

      return sortBy(entries, ['weight']);
    },

    canEditSettings() {
      return (this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING)?.resourceMethods || []).includes('PUT');
    },

    hasSupport() {
      return isRancherPrime() || this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SUPPORTED )?.value === 'true';
    },

    isCurrRouteClusterExplorer() {
      return this.$route?.name?.startsWith('c-cluster');
    },

    productFromRoute() {
      return getProductFromRoute(this.$route);
    },

    aboutText() {
      // If a version number (starts with 'v') then use that
      if (this.displayVersion.startsWith('v')) {
        // Don't show the '.0' for a minor release (e.g. 2.8.0, 2.9.0 etc)
        return !this.displayVersion.endsWith('.0') ? this.displayVersion : this.displayVersion.substr(0, this.displayVersion.length - 2);
      }

      // Default fallback to 'About'
      return this.t('about.title');
    },

    largeAboutText() {
      return this.aboutText.length > 6;
    },

    appBar() {
      let activeFound = false;

      // order is important for the object keys here
      // since we want to check last pinFiltered and clustersFiltered
      const appBar = {
        hciApps:           this.hciApps,
        multiClusterApps:  this.multiClusterApps,
        configurationApps: this.configurationApps,
        pinFiltered:       this.pinFiltered,
        clustersFiltered:  this.clustersFiltered,
      };

      Object.keys(appBar).forEach((menuSection) => {
        const menuSectionItems = appBar[menuSection];
        const isClusterCheck = menuSection === 'pinFiltered' || menuSection === 'clustersFiltered';

        // need to reset active state on other menu items
        menuSectionItems.forEach((item) => {
          item.isMenuActive = false;

          if (!activeFound && this.checkActiveRoute(item, isClusterCheck)) {
            activeFound = true;
            item.isMenuActive = true;
          }
        });
      });

      return appBar;
    }
  },

  // See https://github.com/rancher/dashboard/issues/12831 for outstanding performance related work
  watch: {
    $route() {
      this.shown = false;
    },

    // Before SSP world all of these changes were kicked off given Vue change detection to properties in a computed method.
    // Changes could come from two scenarios
    // 1. Changes made by the user (pin / search). Could be tens per second
    // 2. Changes made by rancher to clusters (state, label, etc change). Could be hundreds a second
    // They can be restricted to help the churn caused from above
    // 1. When SSP enabled reduce http spam
    // 2. When SSP is disabled (legacy) reduce fn churn (this was a known performance customer issue)

    pinnedIds: {
      immediate: true,
      handler(neu, old) {
        if (sameContents(neu, old)) {
          return;
        }

        // Low throughput (user click). Changes should be shown quickly
        this.updateClusters(neu, 'quick');
      }
    },

    search() {
      // Medium throughput. Changes should be shown quickly, unless we want to reduce http spam in SSP world
      this.updateClusters(this.pinnedIds, this.canPagination ? 'medium' : 'quick');
    },

    provClusters: {
      handler(neu, old) {
        // Potentially incredibly high throughput. Changes should be at least limited (slow if state change, quick if added/removed). Shouldn't get here if SSP
        this.updateClusters(this.pinnedIds, neu?.length === old?.length ? 'slow' : 'quick');
      },
      deep:      true,
      immediate: true,
    },

    mgmtClusters: {
      handler(neu, old) {
        // Potentially incredibly high throughput. Changes should be at least limited (slow if state change, quick if added/removed). Shouldn't get here if SSP
        this.updateClusters(this.pinnedIds, neu?.length === old?.length ? 'slow' : 'quick');
      },
      deep:      true,
      immediate: true,
    },

  },

  mounted() {
    document.addEventListener('keyup', this.handler);
  },

  beforeUnmount() {
    document.removeEventListener('keyup', this.handler);
  },

  methods: {
    checkActiveRoute(obj, isClusterRoute) {
      // for Cluster links in main nav: check if route is a cluster explorer one + check if route cluster matches cluster obj id + check if curr product matches route product
      if (isClusterRoute) {
        return this.isCurrRouteClusterExplorer && this.$route?.params?.cluster === obj?.id && this.productFromRoute === this.currentProduct?.name;
      }

      // for remaining main nav items, check if curr product matches route product is enough
      return this.productFromRoute === obj?.value;
    },

    handleKeyComboClick() {
      this.routeCombo = !this.routeCombo;
    },

    clusterMenuClick(ev, cluster) {
      if (this.routeCombo) {
        ev.preventDefault();

        if (this.isCurrRouteClusterExplorer && this.productFromRoute === this.currentProduct?.name) {
          const clusterRoute = {
            name:   this.$route.name,
            params: { ...this.$route.params },
            query:  { ...this.$route.query }
          };

          clusterRoute.params.cluster = cluster.id;

          return this.$router.push(clusterRoute);
        }
      }

      return this.$router.push(cluster.clusterRoute);
    },

    handler(e) {
      if (e.keyCode === KEY.ESCAPE ) {
        this.hide();
      }
    },

    hide() {
      this.shown = false;
      if (this.clustersFiltered === 0) {
        this.clusterFilter = '';
      }
    },

    toggle() {
      this.shown = !this.shown;
    },

    async goToHarvesterCluster() {
      const localCluster = this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER).find((C) => C.id === 'fleet-local/local');

      try {
        await localCluster.goToHarvesterCluster();
      } catch {
      }
    },

    getTooltipConfig(item, showWhenClosed = false) {
      if (!item) {
        return;
      }

      let contentText = '';
      let content;
      let popperClass = '';

      // this is the normal tooltip scenario where we are just passing a string
      if (typeof item === 'string') {
        contentText = item;
        content = this.shown ? null : contentText;

      // if key combo is pressed, then we update the tooltip as well
      } else if (this.routeCombo &&
        typeof item === 'object' &&
        !Array.isArray(item) &&
        item !== null &&
        item.ready) {
        contentText = this.t('nav.keyComboTooltip');

        if (showWhenClosed) {
          content = !this.shown ? contentText : null;
        } else {
          content = this.shown ? contentText : null;
        }

      // this is scenario where we show a tooltip when we are on the expanded menu to show full description
      } else {
        contentText = item.label;
        // this adds a class to the tooltip container so that we can control the max width
        popperClass = 'menu-description-tooltip';

        if (item.description) {
          contentText += `<br><br>${ item.description }`;
        }

        if (showWhenClosed) {
          content = !this.shown ? contentText : null;
        } else {
          content = this.shown ? contentText : null;

          // this adds a class to adjust tooltip position so it doesn't overlap the cluster pinning action
          popperClass += ' description-tooltip-pos-adjustment';
        }
      }

      return {
        content,
        placement:     'right',
        popperOptions: { modifiers: { preventOverflow: { enabled: false }, hide: { enabled: false } } },
        popperClass
      };
    },

    updateClusters(pinnedIds, speed = 'slow' | 'medium' | 'quick') {
      const args = {
        pinnedIds,
        searchTerm:  this.search,
        unPinnedMax: this.maxClustersToShow
      };

      switch (speed) {
      case 'slow':
        this.debouncedHelperUpdateSlow(args);
        break;
      case 'medium':
        this.debouncedHelperUpdateMedium(args);
        break;
      case 'quick':
        this.debouncedHelperUpdateQuick(args);
        break;
      }
    }
  }
};
</script>

<template>
  <div>
    <!-- Overlay -->
    <div
      v-if="shown"
      class="side-menu-glass"
      @click="hide()"
    />
    <transition name="fade">
      <!-- Side menu -->
      <div
        data-testid="side-menu"
        class="side-menu"
        :class="{'menu-open': shown, 'menu-close':!shown}"
        :style="sideMenuStyle"
        tabindex="-1"
        role="navigation"
        :aria-label="t('nav.ariaLabel.topLevelMenu')"
      >
        <!-- Logo and name -->
        <div class="title">
          <div
            data-testid="top-level-menu"
            :aria-label="t('nav.expandCollapseAppBar')"
            role="button"
            tabindex="0"
            class="menu"
            @keyup.enter="toggle()"
            @keyup.space="toggle()"
            @click="toggle()"
          >
            <svg
              class="menu-icon"
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              :alt="t('nav.alt.mainMenuIcon')"
            ><path
              d="M0 0h24v24H0z"
              fill="none"
            /><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
          </div>
          <div class="side-menu-logo">
            <BrandImage
              data-testid="side-menu__brand-img"
              :alt="t('nav.alt.mainMenuRancherLogo')"
              file-name="rancher-logo.svg"
            />
          </div>
        </div>

        <!-- Menu body -->
        <div class="body">
          <div>
            <!-- Home button -->
            <div @click="hide()">
              <router-link
                class="option cluster selector home"
                :to="{ name: 'home' }"
                role="link"
                :aria-label="t('nav.ariaLabel.homePage')"
              >
                <svg
                  v-clean-tooltip="getTooltipConfig(t('nav.home'))"
                  class="top-menu-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                ><path
                  d="M0 0h24v24H0z"
                  fill="none"
                /><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                <div class="home-text">
                  {{ t('nav.home') }}
                </div>
              </router-link>
            </div>
            <!-- Search bar -->
            <div
              v-if="showClusterSearch"
              class="clusters-search"
            >
              <div class="clusters-search-count">
                <span>{{ clusterFilterCount }}</span>
                {{ t('nav.search.clusters') }}
                <i
                  v-if="clusterFilter"
                  class="icon icon-filter_alt"
                />
              </div>

              <div
                class="search"
              >
                <input
                  ref="clusterFilter"
                  v-model="clusterFilter"
                  :placeholder="t('nav.search.placeholder')"
                  :tabindex="!shown ? -1 : 0"
                  :aria-label="t('nav.search.ariaLabel')"
                >
                <i
                  class="magnifier icon icon-search"
                  :class="{ active: clusterFilter }"
                />
                <i
                  v-if="clusterFilter"
                  class="icon icon-close"
                  @click="clusterFilter=''"
                />
              </div>
            </div>
          </div>

          <!-- Harvester extras -->
          <template v-if="hciApps.length">
            <div class="category" />
            <div>
              <a
                v-if="isRancherInHarvester"
                class="option"
                tabindex="0"
                @click="goToHarvesterCluster()"
              >
                <i
                  class="icon icon-dashboard app-icon"
                />
                <div>
                  {{ t('nav.harvesterDashboard') }}
                </div>
              </a>
            </div>
            <div
              v-for="(a, i) in appBar.hciApps"
              :key="i"
              @click="hide()"
            >
              <router-link
                class="option"
                :to="a.to"
                :class="{'active-menu-link': a.isMenuActive }"
                role="link"
                :aria-label="`${t('nav.ariaLabel.harvesterCluster')} ${ a.label }`"
              >
                <IconOrSvg
                  class="app-icon"
                  :icon="a.icon"
                  :src="a.svg"
                />
                <div>{{ a.label }}</div>
              </router-link>
            </div>
          </template>

          <!-- Cluster menu -->
          <template v-if="!!allClustersCount">
            <div
              ref="clusterList"
              class="clusters"
              :style="pinnedClustersHeight"
            >
              <!-- Pinned Clusters -->
              <div
                v-if="showPinClusters && pinFiltered.length"
                class="clustersPinned"
              >
                <div
                  v-for="(c, index) in appBar.pinFiltered"
                  :key="index"
                  :data-testid="`pinned-ready-cluster-${index}`"
                  @click="hide()"
                >
                  <button
                    v-if="c.ready"
                    v-shortkey.push="{windows: ['alt'], mac: ['option']}"
                    :data-testid="`pinned-menu-cluster-${ c.id }`"
                    class="cluster selector option"
                    :class="{'active-menu-link': c.isMenuActive }"
                    :to="c.clusterRoute"
                    role="button"
                    :aria-label="`${t('nav.ariaLabel.cluster')} ${ c.label }`"
                    @click.prevent="clusterMenuClick($event, c)"
                    @shortkey="handleKeyComboClick"
                  >
                    <ClusterIconMenu
                      v-clean-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      :route-combo="routeCombo"
                      class="rancher-provider-icon"
                    />
                    <div
                      v-clean-tooltip="getTooltipConfig(c)"
                      class="cluster-name"
                    >
                      <p>{{ c.label }}</p>
                      <p
                        v-if="c.description"
                        class="description"
                      >
                        {{ c.description }}
                      </p>
                    </div>
                    <Pinned
                      :cluster="c"
                      :tab-order="shown ? 0 : -1"
                    />
                  </button>
                  <span
                    v-else
                    class="option cluster selector disabled"
                    :data-testid="`pinned-menu-cluster-disabled-${ c.id }`"
                  >
                    <ClusterIconMenu
                      v-clean-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      class="rancher-provider-icon"
                    />
                    <div
                      v-clean-tooltip="getTooltipConfig(c)"
                      class="cluster-name"
                    >
                      <p>{{ c.label }}</p>
                      <p
                        v-if="c.description"
                        class="description"
                      >
                        {{ c.description }}
                      </p>
                    </div>
                    <Pinned
                      :cluster="c"
                      :tab-order="shown ? 0 : -1"
                    />
                  </span>
                </div>
                <div
                  v-if="clustersFiltered.length > 0"
                  class="category-title"
                >
                  <hr>
                </div>
              </div>

              <!-- Clusters Search result -->
              <div class="clustersList">
                <div
                  v-for="(c, index) in appBar.clustersFiltered"
                  :key="index"
                  :data-testid="`top-level-menu-cluster-${index}`"
                  @click="hide()"
                >
                  <button
                    v-if="c.ready"
                    v-shortkey.push="{windows: ['alt'], mac: ['option']}"
                    :data-testid="`menu-cluster-${ c.id }`"
                    class="cluster selector option"
                    :class="{'active-menu-link': c.isMenuActive }"
                    :to="c.clusterRoute"
                    role="button"
                    :aria-label="`${t('nav.ariaLabel.cluster')} ${ c.label }`"
                    @click="clusterMenuClick($event, c)"
                    @shortkey="handleKeyComboClick"
                  >
                    <ClusterIconMenu
                      v-clean-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      :route-combo="routeCombo"
                      class="rancher-provider-icon"
                    />
                    <div
                      v-clean-tooltip="getTooltipConfig(c)"
                      class="cluster-name"
                    >
                      <p>{{ c.label }}</p>
                      <p
                        v-if="c.description"
                        class="description"
                      >
                        {{ c.description }}
                      </p>
                    </div>
                    <Pinned
                      :class="{'showPin': c.pinned}"
                      :tab-order="shown ? 0 : -1"
                      :cluster="c"
                    />
                  </button>
                  <span
                    v-else
                    class="option cluster selector disabled"
                    :data-testid="`menu-cluster-disabled-${ c.id }`"
                  >
                    <ClusterIconMenu
                      v-clean-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      class="rancher-provider-icon"
                    />
                    <div
                      v-clean-tooltip="getTooltipConfig(c)"
                      class="cluster-name"
                    >
                      <p>{{ c.label }}</p>
                      <p
                        v-if="c.description"
                        class="description"
                      >
                        {{ c.description }}
                      </p>
                    </div>
                    <Pinned
                      :class="{'showPin': c.pinned}"
                      :tab-order="shown ? 0 : -1"
                      :cluster="c"
                    />
                  </span>
                </div>
              </div>

              <!-- No clusters message -->
              <div
                v-if="clustersFiltered.length === 0 && searchActive"
                data-testid="top-level-menu-no-results"
                class="none-matching"
              >
                {{ t('nav.search.noResults') }}
              </div>
            </div>

            <!-- See all clusters -->
            <router-link
              v-if="allClustersCount > maxClustersToShow"
              class="clusters-all"
              :to="{name: 'c-cluster-product-resource', params: {
                cluster: emptyCluster,
                product: 'manager',
                resource: 'provisioning.cattle.io.cluster'
              } }"
              role="link"
              :aria-label="t('nav.ariaLabel.seeAll')"
            >
              <span>
                {{ shown ? t('nav.seeAllClusters') : t('nav.seeAllClustersCollapsed') }}
                <i class="icon icon-chevron-right" />
              </span>
            </router-link>
          </template>

          <!-- MULTI CLUSTER APPS -->
          <div class="category">
            <template v-if="multiClusterApps.length">
              <div
                class="category-title"
              >
                <hr>
                <span>
                  {{ t('nav.categories.multiCluster') }}
                </span>
              </div>
              <div
                v-for="(a, i) in appBar.multiClusterApps"
                :key="i"
                @click="hide()"
              >
                <router-link
                  class="option"
                  :class="{'active-menu-link': a.isMenuActive }"
                  :to="a.to"
                  role="link"
                  :aria-label="`${t('nav.ariaLabel.multiClusterApps')} ${ a.label }`"
                >
                  <IconOrSvg
                    v-clean-tooltip="getTooltipConfig(a.label)"
                    class="app-icon"
                    :icon="a.icon"
                    :src="a.svg"
                  />
                  <span class="option-link">{{ a.label }}</span>
                </router-link>
              </div>
            </template>

            <!-- Configuration apps menu -->
            <template v-if="configurationApps.length">
              <div
                class="category-title"
              >
                <hr>
                <span>
                  {{ t('nav.categories.configuration') }}
                </span>
              </div>
              <div
                v-for="(a, i) in appBar.configurationApps"
                :key="i"
                @click="hide()"
              >
                <router-link
                  class="option"
                  :class="{'active-menu-link': a.isMenuActive }"
                  :to="a.to"
                  role="link"
                  :aria-label="`${t('nav.ariaLabel.configurationApps')} ${ a.label }`"
                >
                  <IconOrSvg
                    v-clean-tooltip="getTooltipConfig(a.label)"
                    class="app-icon"
                    :icon="a.icon"
                    :src="a.svg"
                  />
                  <div>{{ a.label }}</div>
                </router-link>
              </div>
            </template>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="footer"
        >
          <div
            v-if="canEditSettings"
            class="support"
            @click="hide()"
          >
            <router-link
              :to="{name: 'support'}"
              role="link"
              :aria-label="t('nav.ariaLabel.support')"
            >
              {{ t('nav.support', {hasSupport}) }}
            </router-link>
          </div>
          <div
            class="version"
            :class="{'version-small': largeAboutText}"
            @click="hide()"
          >
            <router-link
              :to="{ name: 'about' }"
              role="link"
              :aria-label="t('nav.ariaLabel.about')"
            >
              {{ aboutText }}
            </router-link>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss">
  .menu-description-tooltip {
    max-width: 200px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .description-tooltip-pos-adjustment {
    // needs !important so that we can
    // offset the tooltip a bit so it doesn't
    // overlap the pin icon and cause bad UX
    left: 48px !important;
  }

  .localeSelector, .footer-tooltip {
    z-index: 1000;
  }

  .localeSelector {
    .v-popper__inner {
      padding: 10px 0;
    }

    .v-popper__arrow-container {
      display: none;
    }

    .v-popper:focus {
      outline: 0;
    }
  }

  .theme-dark .cluster-name .description {
    color: var(--input-label) !important;
  }
  .theme-dark .body .option  {
    &:hover .cluster-name .description,
    &.router-link-active .cluster-name .description,
    &.active-menu-link .cluster-name .description {
      color: var(--side-menu-desc) !important;
  }
  }
</style>

<style lang="scss" scoped>
  $clear-search-size: 20px;
  $icon-size: 25px;
  $option-padding: 9px;
  $option-padding-left: 14px;
  $option-height: $icon-size + $option-padding + $option-padding;

  .side-menu {
    .menu {
      position: absolute;
      width: $app-bar-collapsed-width;
      height: 54px;
      top: 0;
      grid-area: menu;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:focus-visible {
        outline: none;

        .menu-icon {
          @include focus-outline;
          outline-offset: 4px;  // Ensure there is space around the menu icon for the focus indication
        }
      }

      .menu-icon {
        width: 25px;
        height: 25px;
        fill: var(--header-btn-text);
      }
    }

    position: fixed;
    top: 0;
    left: 0px;
    bottom: 0;
    width: $app-bar-collapsed-width;
    background-color: var(--topmenu-bg);
    z-index: 100;
    border-right: 1px solid var(--topmost-border);
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;
    transition: width 250ms;

    &:focus, &:focus-visible {
      outline: 0;
    }

    .option:focus-visible {
      outline: 0;
    }

    &.menu-open {
      width: 300px;
      box-shadow: 3px 1px 3px var(--shadow);

      // because of accessibility, we force pin action to be visible on menu open
      .pin {
        display: block !important;

        &:focus-visible {
          @include focus-outline;
          outline-offset: 4px;
        }
      }
    }

    .title {
      display: flex;
      height: 55px;
      flex: 0 0 55px;
      width: 100%;
      justify-content: flex-start;
      align-items: center;

      .menu {
        display: flex;
        justify-content: center;
      }
      .menu-icon {
        width: 25px;
        height: 25px;
      }
    }
    .home {
      svg {
        width: 25px;
        height: 25px;
        margin-left: 9px;
      }
    }
    .home-text {
      margin-left: $option-padding-left - 7;
    }
    .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin: 10px 0;
      width: 300px;
      overflow: auto;

      .option {
        align-items: center;
        cursor: pointer;
        display: flex;
        color: var(--link);
        font-size: 14px;
        height: $option-height;
        white-space: nowrap;
        background-color: transparent;
        width: 100%;
        border-radius: 0;
        border: none;

        .cluster-badge-logo-text {
          color: var(--default-active-text);
          font-weight: 500;
        }

        .pin {
          font-size: 16px;
          margin-left: auto;
          display: none;
          color: var(--body-text);
          &.showPin {
            display: block;
          }
        }

        .cluster-name {
          line-height: normal;

          & > p {
            width: 182px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: left;

            &.description {
              font-size: 12px;
              padding-right: 8px;
              color: var(--darker);
            }
          }
        }

        &:hover {
          text-decoration: none;

          .pin {
            display: block;
            color: var(--darker-text);
          }
        }
        &.disabled {
          background: transparent;
          cursor: not-allowed;

          .rancher-provider-icon,
          .cluster-name p {
            filter: grayscale(1);
            color: var(--muted) !important;
          }

          .pin {
            cursor: pointer;
          }
        }

        &:focus {
          outline: 0;
          box-shadow: none;
        }

        > i, > img {
          display: block;
          font-size: $icon-size;
          margin-right: 14px;
          &:not(.pin){
            width: 42px;
          }
        }

        .rancher-provider-icon,
        svg {
          margin-right: 16px;
          fill: var(--link);
        }

        .top-menu-icon {
          outline-offset: 4px;
        }

        &.router-link-active, &.active-menu-link {
          &:focus-visible {
            .top-menu-icon, .app-icon {
              @include focus-outline;
            }
          }

          &:focus-visible .rancher-provider-icon {
            @include focus-outline;
            outline-offset: -4px;
          }

          background: var(--primary-hover-bg);
          color: var(--primary-hover-text);

          svg {
            fill: var(--primary-hover-text);
          }

          i {
            color: var(--primary-hover-text);
          }

          div .description {
            color: var(--default);
          }
        }

        &:focus-visible {
          .top-menu-icon, .rancher-provider-icon, .app-icon {
            @include focus-outline;
          }
        }

        &:hover {
          color: var(--primary-hover-text);
          background: var(--primary-hover-bg);
          > div {
            color: var(--primary-hover-text);

            .description {
              color: var(--default);
            }
          }
          svg {
            fill: var(--primary-hover-text);
          }
          div {
            color: var(--primary-hover-text);
          }
          &.disabled {
            background: transparent;
            color: var(--muted);

            > .pin {
              color:var(--default-text);
              display: block;
            }
          }
        }
      }

      .option, .option-disabled {
        padding: $option-padding 0 $option-padding $option-padding-left;
      }

      .search {
        position: relative;
        > input {
          background-color: transparent;
          padding-right: 35px;
          padding-left: 25px;
          height: 32px;
        }
        > .magnifier {
          position: absolute;
          top: 12px;
          left: 8px;
          width: 12px;
          height: 12px;
          font-size: 12px;
          opacity: 0.4;

          &.active {
            opacity: 1;

            &:hover {
              color: var(--body-text);
            }
          }
        }
        > i {
          position: absolute;
          font-size: 12px;
          top: 12px;
          right: 8px;
          opacity: 0.7;
          cursor: pointer;
          &:hover {
            color: var(--disabled-bg);
          }
        }
      }

      .clusters-all {
        display: flex;
        flex-direction: row-reverse;
        margin-right: 16px;
        margin-top: 10px;

        &:focus-visible {
          outline: none;
        }

        span {
          display: flex;
          align-items: center;
        }

        &:focus-visible span {
          @include focus-outline;
          outline-offset: 4px;
        }
      }

      .clusters {
        overflow-y: auto;

         a, span {
          margin: 0;
         }

        &-search {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 16px 0;
          height: 42px;

          .search {
            transition: all 0.25s ease-in-out;
            transition-delay: 2s;
            width: 72%;
            height: 36px;

            input {
              height: 100%;
            }
          }

          &-count {
            position: relative;
            display: flex;
            flex-direction: column;
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--default-active-text);
            margin-left: $option-padding-left;
            border-radius: 5px;
            font-size: 10px;
            font-weight: bold;

            span {
              font-size: 14px;
            }

            .router-link-active {
              &:hover {
                text-decoration: none;
              }
            }

            i {
              font-size: 12px;
              position: absolute;
              right: -3px;
              top: 2px;
            }
          }
        }
      }

      .none-matching {
        width: 100%;
        text-align: center;
        padding: 8px
      }

      .clustersPinned {
        .category {
          &-title {
            margin: 8px 0;
            margin-left: 16px;
            hr {
              margin: 0;
              width: 94%;
              transition: all 0.25s ease-in-out;
              max-width: 100%;
            }
          }
        }
        .pin {
          display: block;
        }
      }

      .category {
        display: flex;
        flex-direction: column;
        place-content: flex-end;
        flex: 1;

        &-title {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          align-items: center;
          margin: 15px 0;
          margin-left: 16px;
          font-size: 14px;
          text-transform: uppercase;

          span {
            transition: all 0.25s ease-in-out;
            display: flex;
            max-height: 16px;
          }

          hr {
            margin: 0;
            max-width: 50px;
            width: 0;
            transition: all 0.25s ease-in-out;
          }
        }

         i {
            padding-left: $option-padding-left - 5;
          }
      }
    }

    &.menu-open {
      .option {
        &.router-link-active, &.active-menu-link {
          &:focus-visible {
            @include focus-outline;
            border-radius: 0;
            outline-offset: -4px;

            .top-menu-icon, .app-icon, .rancher-provider-icon {
              outline: none;
              border-radius: 0;
            }
          }
        }

        &:focus-visible {
          @include focus-outline;
          outline-offset: -4px;

          .top-menu-icon, .app-icon, .rancher-provider-icon {
            outline: none;
            border-radius: 0;
          }
        }
      }
    }

    &.menu-close {
      .side-menu-logo  {
        opacity: 0;
      }
      .category {
        &-title {
          span {
            opacity: 0;
          }

          hr {
            width: 40px;
          }
        }
      }
      .clusters-all {
        flex-direction: row;
        margin-left: $option-padding-left + 2;

        span {
          i {
            display: none;
          }
        }
      }

      .clustersPinned {
        .category {
          &-title {
            hr {
              width: 40px;
            }
          }
        }
      }

      .footer {
        margin: 20px 10px;
        width: 50px;

        .support {
          display: none;
        }

        .version{
          text-align: center;

          &.version-small {
            font-size: 12px;
          }
        }
      }
    }

    .footer {
      margin: 20px;
      width: 240px;
      display: flex;
      flex: 0;
      flex-direction: row;
      > * {
        flex: 1;
        color: var(--link);

        &:first-child {
          text-align: left;
        }
        &:last-child {
          text-align: right;
        }
        text-align: center;
      }

      .support a:focus-visible {
        @include focus-outline;
        outline-offset: 4px;
      }

      .version {
        cursor: pointer;

        a:focus-visible {
          @include focus-outline;
          outline-offset: 4px;
        }
      }
    }
  }

  .side-menu-glass {
    position: absolute;
    top: 0;
    left: 0px;
    bottom: 0;
    width: 100vw;
    z-index: 99;
    opacity: 1;
  }

  .side-menu-logo {
    align-items: center;
    display: flex;
    transform: translateX($app-bar-collapsed-width);
    opacity: 1;
    max-width: 200px;
    width: 100%;
    justify-content: center;
    transition: all 0.5s;
    overflow: hidden;
    & IMG {
      object-fit: contain;
      height: 21px;
      max-width: 200px;
    }
  }

  .fade-enter-active, .fade-leave-active {
    transition: all 0.25s;
    transition-timing-function: ease;
  }

  .fade-leave-active {
    transition: all 0.25s;
  }

  .fade-leave-to {
    left: -300px;
  }

  .fade-enter {
    left: -300px;
  }

  .locale-chooser {
    cursor: pointer;
  }

  .localeSelector {
    :deep() .v-popper__inner {
      padding: 50px 0;
    }

    :deep() .v-popper__arrow-container {
      display: none;
    }

    :deep() .v-popper:focus {
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
