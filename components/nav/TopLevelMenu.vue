<script>
import BrandImage from '@/components/BrandImage';
import ClusterProviderIcon from '@/components/ClusterProviderIcon';
import { mapGetters } from 'vuex';
import $ from 'jquery';
import { MANAGEMENT } from '@/config/types';
import { mapPref, DEV, MENU_MAX_CLUSTERS } from '@/store/prefs';
import { sortBy } from '@/utils/sort';
import { ucFirst } from '@/utils/string';
import { KEY } from '@/utils/platform';
import { getVersionInfo } from '@/utils/version';
import { LEGACY } from '@/store/features';
import { SETTING } from '@/config/settings';
import { filterOnlyKubernetesClusters } from '@/utils/cluster';

const UNKNOWN = 'unknown';
const UI_VERSION = process.env.VERSION || UNKNOWN;
const UI_COMMIT = process.env.COMMIT || UNKNOWN;

export default {

  components: { BrandImage, ClusterProviderIcon },

  data() {
    const { displayVersion, fullVersion } = getVersionInfo(this.$store);

    return {
      shown:          false,
      displayVersion,
      fullVersion,
      uiCommit:       UI_COMMIT,
      uiVersion:      UI_VERSION,
      clusterFilter:  '',
    };
  },

  computed: {
    ...mapGetters(['clusterId']),
    ...mapGetters(['clusterReady', 'isRancher', 'currentCluster', 'currentProduct']),
    ...mapGetters('type-map', ['activeProducts']),
    ...mapGetters('i18n', ['selectedLocaleLabel', 'availableLocales']),
    ...mapGetters({ features: 'features/get' }),

    value: {
      get() {
        return this.$store.getters['productId'];
      },
    },

    legacyEnabled() {
      return this.features(LEGACY);
    },

    showClusterSearch() {
      return this.clusters.length > this.maxClustersToShow;
    },

    clusters() {
      const all = this.$store.getters['management/all'](MANAGEMENT.CLUSTER);
      const kubeClusters = filterOnlyKubernetesClusters(all);

      return kubeClusters.map((x) => {
        return {
          id:              x.id,
          label:           x.nameDisplay,
          ready:           x.isReady,
          osLogo:          x.providerOsLogo,
          providerNavLogo: x.providerMenuLogo,
          badge:           x.badge,
          isLocal:         x.isLocal
        };
      });
    },

    clustersFiltered() {
      const search = (this.clusterFilter || '').toLowerCase();

      const out = search ? this.clusters.filter(item => item.label.toLowerCase().includes(search)) : this.clusters;

      const sorted = sortBy(out, ['ready:desc', 'label']);

      return sorted;
    },

    dev: mapPref(DEV),

    maxClustersToShow: mapPref(MENU_MAX_CLUSTERS),

    showLocale() {
      return Object.keys(this.availableLocales).length > 1 || this.dev;
    },

    showNone() {
      return this.dev;
    },

    multiClusterApps() {
      const options = this.options;

      return options.filter(opt => opt.inStore === 'management' && opt.category !== 'configuration' && opt.category !== 'legacy');
    },

    legacyApps() {
      const options = this.options;

      return options.filter(opt => opt.inStore === 'management' && opt.category === 'legacy');
    },

    configurationApps() {
      const options = this.options;

      const items = options.filter(opt => opt.category === 'configuration');

      // Add plugin page
      items.push({
        label:   'Plugins',
        inStore: 'management',
        icon:    'icon-gear',
        value:   'plugins',
        weight:  1,
        to:      { name: 'plugins' },
      });

      return items;
    },

    options() {
      const cluster = this.clusterId || this.$store.getters['defaultClusterId'];

      const entries = this.activeProducts.map((p) => {
        // Try product-specific index first
        const to = {
          name:   `c-cluster-${ p.name }`,
          params: { cluster }
        };

        if ( !this.$router.getMatchedComponents(to).length ) {
          to.name = 'c-cluster-product';
          to.params.product = p.name;
        }

        return {
          label:     this.$store.getters['i18n/withFallback'](`product."${ p.name }"`, null, ucFirst(p.name)),
          icon:      `icon-${ p.icon || 'copy' }`,
          value:     p.name,
          removable: p.removable !== false,
          inStore:   p.inStore || 'cluster',
          weight:    p.weight || 1,
          category:  p.category || 'none',
          to,
        };
      });

      return sortBy(entries, ['weight']);
    },

    canEditSettings() {
      return (this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING)?.resourceMethods || []).includes('PUT');
    },

    hasSupport() {
      return this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SUPPORTED )?.value === 'true';
    },
  },

  watch: {
    $route() {
      this.shown = false;
    },
  },

  mounted() {
    document.addEventListener('keyup', this.handler);
  },

  beforeDestroy() {
    document.removeEventListener('keyup', this.handler);
  },

  methods: {
    // Cluster list number of items shown is configurable via user preference
    setClusterListHeight(maxToShow) {
      const el = this.$refs.clusterList;
      const max = Math.min(maxToShow, this.clusters.length);

      if (el) {
        const $el = $(el);
        const h = 33 * max;

        $el.css('height', `${ h }px`);
      }
    },
    handler(e) {
      if (e.keyCode === KEY.ESCAPE ) {
        this.hide();
      }
    },

    hide() {
      this.shown = false;
    },

    toggle() {
      this.shown = !this.shown;
      this.$nextTick(() => {
        this.setClusterListHeight(this.maxClustersToShow);
      });
    },

    switchLocale(locale) {
      this.$store.dispatch('i18n/switchTo', locale);
    },
  }
};
</script>
<template>
  <div>
    <div class="menu" :class="{'raised': shown, 'unraised':!shown}" @click="toggle()">
      <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none" /><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
    </div>
    <div v-if="shown" class="side-menu-glass" @click="hide()"></div>
    <transition name="fade">
      <div v-if="shown" class="side-menu" tabindex="-1">
        <div class="title">
          <div class="menu-spacer"></div>
          <div class="side-menu-logo">
            <BrandImage file-name="rancher-logo.svg" />
          </div>
        </div>
        <div class="body">
          <div @click="hide()">
            <nuxt-link
              class="option cluster selector home"
              :to="{ name: 'home' }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none" /><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
              <div>
                {{ t('nav.home') }}
              </div>
            </nuxt-link>
          </div>
          <template v-if="clusters && !!clusters.length">
            <div class="category">
              {{ t('nav.categories.explore') }}
            </div>
            <div v-if="showClusterSearch" class="search">
              <input
                ref="clusterFilter"
                v-model="clusterFilter"
                :placeholder="t('nav.search.placeholder')"
              />
              <i v-if="clusterFilter" class="icon icon-close" @click="clusterFilter=''" />
            </div>
            <div ref="clusterList" class="clusters">
              <div v-for="c in clustersFiltered" :key="c.id" @click="hide()">
                <nuxt-link
                  v-if="c.ready"
                  class="cluster selector option"
                  :to="{ name: 'c-cluster', params: { cluster: c.id } }"
                >
                  <ClusterProviderIcon :small="true" :cluster="c" class="rancher-provider-icon mr-10" />
                  <div class="cluster-name">
                    {{ c.label }}
                  </div>
                </nuxt-link>
                <span v-else class="option-disabled cluster selector disabled">
                  <ClusterProviderIcon :small="true" :cluster="c" class="rancher-provider-icon mr-10" />
                  <div class="cluster-name">{{ c.label }}</div>
                </span>
              </div>
              <div v-if="clustersFiltered.length === 0" class="none-matching">
                {{ t('nav.search.noResults') }}
              </div>
            </div>
          </template>

          <template v-if="multiClusterApps.length">
            <div class="category">
              {{ t('nav.categories.multiCluster') }}
            </div>
            <div v-for="a in multiClusterApps" :key="a.label" @click="hide()">
              <nuxt-link class="option" :to="a.to">
                <i class="icon group-icon" :class="a.icon" />
                <div>{{ a.label }}</div>
              </nuxt-link>
            </div>
          </template>
          <template v-if="legacyEnabled">
            <div class="category">
              {{ t('nav.categories.legacy') }}
            </div>
            <div v-for="a in legacyApps" :key="a.label" @click="hide()">
              <nuxt-link class="option" :to="a.to">
                <i class="icon group-icon" :class="a.icon" />
                <div>{{ a.label }}</div>
              </nuxt-link>
            </div>
          </template>
          <template v-if="configurationApps.length">
            <div class="category">
              {{ t('nav.categories.configuration') }}
            </div>
            <div v-for="a in configurationApps" :key="a.label" @click="hide()">
              <nuxt-link class="option" :to="a.to">
                <i class="icon group-icon" :class="a.icon" />
                <div>{{ a.label }}</div>
              </nuxt-link>
            </div>
          </template>
          <div class="pad"></div>
        </div>
        <div class="footer">
          <div v-if="canEditSettings" @click="hide()">
            <nuxt-link :to="{name: 'support'}">
              {{ t('nav.support', {hasSupport}) }}
            </nuxt-link>
          </div>
          <div @click="hide()">
            <nuxt-link
              v-tooltip="{ content: fullVersion, classes: 'footer-tooltip' }"
              :to="{ name: 'about' }"
              class="version"
              v-html="displayVersion"
            />
          </div>
          <div v-if="showLocale">
            <v-popover
              popover-class="localeSelector"
              placement="top"
              trigger="click"
            >
              <a class="locale-chooser">
                {{ selectedLocaleLabel }}
              </a>

              <template slot="popover">
                <ul class="list-unstyled dropdown" style="margin: -1px;">
                  <li v-if="showNone" v-t="'locale.none'" class="hand" @click="switchLocale('none')" />
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
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
  .cluster.disabled > * {
    cursor: not-allowed;
    filter: grayscale(1);
    color: var(--muted);
  }
</style>

<style lang="scss">
  .localeSelector, .footer-tooltip {
    z-index: 1000;
  }

  .cluster {
    &.selector:not(.disabled):hover {
      color: var(--primary-hover-text);
      background: var(--primary-hover-bg);
      border-radius: 5px;
      text-decoration: none;

      .rancher-provider-icon {
        .rancher-icon-fill {
          fill: var(--primary-hover-text);;
        }
      }
    }

    .rancher-provider-icon {
      .rancher-icon-fill {
        // Should match .option color
        fill: var(--link);
      }
    }
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

</style>

<style lang="scss" scoped>
  $clear-search-size: 20px;
  $icon-size: 25px;
  $option-padding: 4px;
  $option-height: $icon-size + $option-padding + $option-padding;

  .option {
    align-items: center;
    cursor: pointer;
    display: flex;
    color: var(--link);

    &:hover {
      text-decoration: none;
    }

    &:focus {
      outline: 0;
      > div {
        text-decoration: underline;
      }
    }

    > i {
      width: $icon-size;
      font-size: $icon-size;
      margin-right: 8px;
    }
    svg {
      margin-right: 8px;
      fill: var(--link);
    }

    > div {
      color: var(--link);
    }

    &:hover {
      color: var(--primary-hover-text);
      background: var(--primary-hover-bg);
      border-radius: 5px;
      > div {
        color: var(--primary-hover-text);
      }
      svg {
        fill: var(--primary-hover-text);
      }
      div {
        color: var(--primary-hover-text);
      }
    }
  }

  .option, .option-disabled {
    padding: $option-padding 0 $option-padding 10px;
  }

  .menu {
    position: absolute;
    left: 0;
    width: 55px;
    height: 54px;
    top: 0;
    grid-area: menu;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      background-color: var(--topmost-light-hover);
    }
    .menu-icon {
      width: 24px;
      height: 24px;
      fill: var(--header-btn-text);
    }
    &.raised {
      z-index: 200;
    }
  }

  .side-menu {
    position: absolute;
    top: 0;
    left: 0px;
    bottom: 0;
    width: 280px;
    background-color: var(--topmenu-bg);
    z-index: 100;
    border-right: 1px solid var(--topmost-border);
    box-shadow: 0 0 15px 4px var(--topmost-shadow);
    display: flex;
    flex-direction: column;
    padding: 0;

    &:focus {
      outline: 0;
    }

    .title {
      display: flex;
      height: 55px;
      flex: 0 0 55px;
      width: 100%;
      border-bottom: 1px solid var(--nav-border);
      justify-content: flex-start;
      align-items: center;
      .menu {
        display: flex;
        justify-content: center;
        width: 55px;
        margin-right: 10px;
      }
      .menu-icon {
        width: 24px;
        height: 24px;
      }
      .menu-spacer {
        width: 55px;
      }
    }
    .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin: 10px 20px;

      .category {
        padding: 10px 0;
        text-transform: uppercase;
        opacity: 0.8;
        margin-top: 10px;
      }

      .home {
        color: var(--link);
      }

      .home:focus {
        outline: 0;
      }

      .cluster {
        align-items: center;
        display: flex;
        height: $option-height;

        white-space: nowrap;
        &:focus {
          outline: 0;
        }
        .cluster-name {
          text-overflow: ellipsis;
          overflow: hidden;
        }
        > img {
          max-height: $icon-size;
          max-width: $icon-size;
          margin-right: 8px;
        }
      }

      .pad {
        flex: 1;
      }

      .search {
        position: relative;
        > input {
          background-color: transparent;
          margin-bottom: 8px;
          padding-right: 34px;
        }
        > i {
          position: absolute;
          font-size: $clear-search-size;
          top: 9px;
          right: 8px;
          opacity: 0.7;
          cursor: pointer;
          &:hover {
            color: var(--disabled-bg);
          }
        }
      }

      .clusters {
        overflow-y: auto;
        overflow-x: hidden;
      }

      .none-matching {
        padding: 8px
      }
    }
    .footer {
      margin: 20px;

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
    background-color: transparent;
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
    margin-left: 10px;
    opacity: 1;
    transition: opacity 1.2s;
    transition-delay: 0s;
    height: 55px;
    max-width: 200px;
    & IMG {
      object-fit: contain;
      height: 21px;
      max-width: 200px;
    }
  }

  .fade-enter-active {
    .side-menu-logo {
      opacity: 0;
    }
  }

  .fade-enter-active, .fade-leave-active {
    transition: all 0.2s;
    transition-timing-function: ease;
  }

  .fade-leave-active {
    transition: all 0.4s;
  }

  .fade-leave-to {
    left: -300px;
  }

  .fade-enter {
    left: -300px;

    .side-menu-logo {
      opacity: 0;
    }
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
