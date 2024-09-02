<script>
import BrandImage from '@shell/components/BrandImage';
import ClusterIconMenu from '@shell/components/ClusterIconMenu';
import IconOrSvg from '../IconOrSvg';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { mapGetters } from 'vuex';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import { MENU_MAX_CLUSTERS } from '@shell/store/prefs';
import { sortBy } from '@shell/utils/sort';
import { ucFirst } from '@shell/utils/string';
import { KEY } from '@shell/utils/platform';
import { getVersionInfo } from '@shell/utils/version';
import { LEGACY } from '@shell/store/features';
import { SETTING } from '@shell/config/settings';
import { filterOnlyKubernetesClusters, filterHiddenLocalCluster } from '@shell/utils/cluster';
import { getProductFromRoute } from '@shell/utils/router';
import { isRancherPrime } from '@shell/config/version';
import Pinned from '@shell/components/nav/Pinned';
import { getGlobalBannerFontSizes } from '@shell/utils/banners';

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

    return {
      shown:             false,
      displayVersion,
      fullVersion,
      clusterFilter:     '',
      hasProvCluster,
      maxClustersToShow: MENU_MAX_CLUSTERS,
      emptyCluster:      BLANK_CLUSTER,
      showPinClusters:   false,
      searchActive:      false,
      routeCombo:        false,
    };
  },

  fetch() {
    if (this.hasProvCluster) {
      this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });
    }
  },

  computed: {
    ...mapGetters(['clusterId']),
    ...mapGetters(['clusterReady', 'isRancher', 'currentCluster', 'currentProduct', 'isRancherInHarvester']),
    ...mapGetters({ features: 'features/get' }),
    value: {
      get() {
        return this.$store.getters['productId'];
      },
    },
    sideMenuStyle() {
      const globalBannerSettings = getGlobalBannerFontSizes(this.$store);

      return {
        marginBottom: globalBannerSettings?.footerFont,
        marginTop:    globalBannerSettings?.headerFont
      };
    },

    legacyEnabled() {
      return this.features(LEGACY);
    },

    showClusterSearch() {
      return this.clusters.length > this.maxClustersToShow;
    },

    clusters() {
      const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
      let kubeClusters = filterHiddenLocalCluster(filterOnlyKubernetesClusters(all, this.$store), this.$store);
      let pClusters = null;

      if (this.hasProvCluster) {
        pClusters = this.$store.getters['management/all'](CAPI.RANCHER_CLUSTER);
        const available = pClusters.reduce((p, c) => {
          p[c.mgmt] = true;

          return p;
        }, {});

        // Filter to only show mgmt clusters that exist for the available provisioning clusters
        // Addresses issue where a mgmt cluster can take some time to get cleaned up after the corresponding
        // provisioning cluster has been deleted
        kubeClusters = kubeClusters.filter((c) => !!available[c]);
      }

      return kubeClusters?.map((x) => {
        const pCluster = pClusters?.find((c) => c.mgmt?.id === x.id);

        return {
          id:              x.id,
          label:           x.nameDisplay,
          ready:           x.isReady && !pCluster?.hasError,
          osLogo:          x.providerOsLogo,
          providerNavLogo: x.providerMenuLogo,
          badge:           x.badge,
          isLocal:         x.isLocal,
          isHarvester:     x.isHarvester,
          pinned:          x.pinned,
          description:     pCluster?.description || x.description,
          pin:             () => x.pin(),
          unpin:           () => x.unpin(),
          clusterRoute:    { name: 'c-cluster-explorer', params: { cluster: x.id } }
        };
      }) || [];
    },

    clustersFiltered() {
      const search = (this.clusterFilter || '').toLowerCase();
      const out = search ? this.clusters.filter((item) => item.label?.toLowerCase().includes(search)) : this.clusters;
      const sorted = sortBy(out, ['ready:desc', 'label']);

      // put local cluster on top of list always
      // https://github.com/rancher/dashboard/issues/10975
      if (sorted.findIndex((c) => c.id === 'local') > 0) {
        const localCluster = sorted.find((c) => c.id === 'local');
        const localIndex = sorted.findIndex((c) => c.id === 'local');

        sorted.splice(localIndex, 1);
        sorted.unshift(localCluster);
      }

      if (search) {
        this.showPinClusters = false;
        this.searchActive = !sorted.length > 0;

        return sorted;
      }
      this.showPinClusters = true;
      this.searchActive = false;

      if (sorted.length >= this.maxClustersToShow) {
        const sortedPinOut = sorted.filter((item) => !item.pinned).slice(0, this.maxClustersToShow);

        return sortedPinOut;
      } else {
        return sorted.filter((item) => !item.pinned);
      }
    },

    pinFiltered() {
      const out = this.clusters.filter((item) => item.pinned);
      const sorted = sortBy(out, ['ready:desc', 'label']);

      // put local cluster on top of list always
      // https://github.com/rancher/dashboard/issues/10975
      if (sorted.findIndex((c) => c.id === 'local') > 0) {
        const localCluster = sorted.find((c) => c.id === 'local');
        const localIndex = sorted.findIndex((c) => c.id === 'local');

        sorted.splice(localIndex, 1);
        sorted.unshift(localCluster);
      }

      return sorted;
    },

    pinnedClustersHeight() {
      const pinCount = this.clusters.filter((item) => item.pinned).length;
      const height = pinCount > 2 ? (pinCount * 43) : 90;

      return `min-height: ${ height }px`;
    },
    clusterFilterCount() {
      return this.clusterFilter ? this.clustersFiltered.length : this.clusters.length;
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

    legacyApps() {
      const options = this.options;

      return options.filter((opt) => opt.inStore === 'management' && opt.category === 'legacy');
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
        legacyApps:        this.legacyApps,
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

  watch: {
    $route() {
      this.shown = false;
    }
  },

  mounted() {
    document.addEventListener('keyup', this.handler);
  },

  beforeDestroy() {
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
      let classes = '';

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
        classes = 'menu-description-tooltip';

        if (item.description) {
          contentText += `<br><br>${ item.description }`;
        }

        if (showWhenClosed) {
          content = !this.shown ? contentText : null;
        } else {
          content = this.shown ? contentText : null;

          // this adds a class to adjust tooltip position so it doesn't overlap the cluster pinning action
          classes += ' description-tooltip-pos-adjustment';
        }
      }

      return {
        content,
        placement:     'right',
        popperOptions: { modifiers: { preventOverflow: { enabled: false }, hide: { enabled: false } } },
        classes
      };
    },
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
      >
        <!-- Logo and name -->
        <div class="title">
          <div
            data-testid="top-level-menu"
            class="menu"
            @click="toggle()"
          >
            <svg
              class="menu-icon"
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              viewBox="0 0 24 24"
              width="24"
            ><path
              d="M0 0h24v24H0z"
              fill="none"
            /><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
          </div>
          <div class="side-menu-logo">
            <BrandImage
              data-testid="side-menu__brand-img"
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
              >
                <svg
                  v-tooltip="getTooltipConfig(t('nav.home'))"
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
                @click="goToHarvesterCluster()"
              >
                <i
                  class="icon icon-dashboard"
                />
                <div>
                  {{ t('nav.harvesterDashboard') }}
                </div>
              </a>
            </div>
            <div
              v-for="a in appBar.hciApps"
              :key="a.label"
              @click="hide()"
            >
              <router-link
                class="option"
                :to="a.to"
                :class="{'active-menu-link': a.isMenuActive }"
              >
                <IconOrSvg
                  :icon="a.icon"
                  :src="a.svg"
                />
                <div>{{ a.label }}</div>
              </router-link>
            </div>
          </template>

          <!-- Cluster menu -->
          <template v-if="clusters && !!clusters.length">
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
                  :key="c.id"
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
                    @click.prevent="clusterMenuClick($event, c)"
                    @shortkey="handleKeyComboClick"
                  >
                    <ClusterIconMenu
                      v-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      :route-combo="routeCombo"
                      class="rancher-provider-icon"
                    />
                    <div
                      v-tooltip="getTooltipConfig(c)"
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
                    />
                  </button>
                  <span
                    v-else
                    class="option cluster selector disabled"
                    :data-testid="`pinned-menu-cluster-disabled-${ c.id }`"
                  >
                    <ClusterIconMenu
                      v-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      class="rancher-provider-icon"
                    />
                    <div
                      v-tooltip="getTooltipConfig(c)"
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
                  :key="c.id"
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
                    @click="clusterMenuClick($event, c)"
                    @shortkey="handleKeyComboClick"
                  >
                    <ClusterIconMenu
                      v-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      :route-combo="routeCombo"
                      class="rancher-provider-icon"
                    />
                    <div
                      v-tooltip="getTooltipConfig(c)"
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
                      :cluster="c"
                    />
                  </button>
                  <span
                    v-else
                    class="option cluster selector disabled"
                    :data-testid="`menu-cluster-disabled-${ c.id }`"
                  >
                    <ClusterIconMenu
                      v-tooltip="getTooltipConfig(c, true)"
                      :cluster="c"
                      class="rancher-provider-icon"
                    />
                    <div
                      v-tooltip="getTooltipConfig(c)"
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
                      :cluster="c"
                    />
                  </span>
                </div>
              </div>

              <!-- No clusters message -->
              <div
                v-if="(clustersFiltered.length === 0 || pinFiltered.length === 0) && searchActive"
                data-testid="top-level-menu-no-results"
                class="none-matching"
              >
                {{ t('nav.search.noResults') }}
              </div>
            </div>

            <!-- See all clusters -->
            <router-link
              v-if="clusters.length > maxClustersToShow"
              class="clusters-all"
              :to="{name: 'c-cluster-product-resource', params: {
                cluster: emptyCluster,
                product: 'manager',
                resource: 'provisioning.cattle.io.cluster'
              } }"
            >
              <span>
                {{ shown ? t('nav.seeAllClusters') : t('nav.seeAllClustersCollapsed') }}
                <i class="icon icon-chevron-right" />
              </span>
            </router-link>
          </template>

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
                v-for="a in appBar.multiClusterApps"
                :key="a.label"
                @click="hide()"
              >
                <router-link
                  class="option"
                  :class="{'active-menu-link': a.isMenuActive }"
                  :to="a.to"
                >
                  <IconOrSvg
                    v-tooltip="getTooltipConfig(a.label)"
                    :icon="a.icon"
                    :src="a.svg"
                  />
                  <span class="option-link">{{ a.label }}</span>
                </router-link>
              </div>
            </template>
            <template v-if="legacyEnabled">
              <div
                class="category-title"
              >
                <hr>
                <span>
                  {{ t('nav.categories.legacy') }}
                </span>
              </div>
              <div
                v-for="a in appBar.legacyApps"
                :key="a.label"
                @click="hide()"
              >
                <router-link
                  class="option"
                  :class="{'active-menu-link': a.isMenuActive }"
                  :to="a.to"
                >
                  <IconOrSvg
                    v-tooltip="getTooltipConfig(a.label)"
                    :icon="a.icon"
                    :src="a.svg"
                  />
                  <div>{{ a.label }}</div>
                </router-link>
              </div>
            </template>

            <!-- App menu -->
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
                v-for="a in appBar.configurationApps"
                :key="a.label"
                @click="hide()"
              >
                <router-link
                  class="option"
                  :class="{'active-menu-link': a.isMenuActive }"
                  :to="a.to"
                >
                  <IconOrSvg
                    v-tooltip="getTooltipConfig(a.label)"
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
    left: 35px !important;
  }

  .localeSelector, .footer-tooltip {
    z-index: 1000;
  }

  .localeSelector {
    .popover-inner {
      padding: 10px 0;
    }

    .popover-arrow {
      display: none;
    }

    .popover:focus {
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

    &:focus {
      outline: 0;
    }

     &.menu-open {
      width: 300px;
      box-shadow: 3px 1px 3px var(--shadow);
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
            width: 195px;
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

          > div {
            text-decoration: underline;
          }
        }

        > i, > img {
          display: block;
          width: 42px;
          font-size: $icon-size;
          margin-right: 14px;
        }

        .rancher-provider-icon,
        svg {
          margin-right: 16px;
          fill: var(--link);
        }

        &.router-link-active, &.active-menu-link {
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

        span {
          display: flex;
          align-items: center;
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

      .version {
        cursor: pointer;
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
