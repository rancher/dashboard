<script>
import { mapGetters } from 'vuex';
import { CAPI, MANAGEMENT } from '@shell/config/types';
import { MENU_MAX_CLUSTERS } from '@shell/store/prefs';
import { SETTING } from '@shell/config/settings';
import Footer from '@shell/components/Navigation/GlobalNavigation/Footer';
import Title from '@shell/components/Navigation/GlobalNavigation/Title';
import Body from '@shell/components/Navigation/GlobalNavigation/Body';

export default {
  components: {
    Body,
    Footer,
    Title
  },

  data() {
    return {
      shown:             false,
      maxClustersToShow: MENU_MAX_CLUSTERS,
      showPinClusters:   false,
      searchActive:      false,
    };
  },

  fetch() {
    if (this.hasProvCluster) {
      this.$store.dispatch('management/findAll', { type: CAPI.RANCHER_CLUSTER });
    }
  },

  computed: {
    ...mapGetters(['clusterReady', 'isRancher', 'currentCluster', 'currentProduct', 'isRancherInHarvester']),
    ...mapGetters({ features: 'features/get' }),
    value: {
      get() {
        return this.$store.getters['productId'];
      },
    },
    sideMenuStyle() {
      return {
        marginBottom: this.globalBannerSettings?.footerFont,
        marginTop:    this.globalBannerSettings?.headerFont
      };
    },

    globalBannerSettings() {
      const settings = this.$store.getters['management/all'](MANAGEMENT.SETTING);
      const bannerSettings = settings?.find((s) => s.id === SETTING.BANNERS);

      if (bannerSettings) {
        const parsed = JSON.parse(bannerSettings.value);
        const {
          showFooter, showHeader, bannerFooter, bannerHeader, banner
        } = parsed;

        // add defaults to accomodate older JSON structures for banner definitions without breaking the UI
        // https://github.com/rancher/dashboard/issues/10140
        const bannerHeaderFontSize = bannerHeader?.fontSize || banner?.fontSize || '14px';
        const bannerFooterFontSize = bannerFooter?.fontSize || banner?.fontSize || '14px';

        return {
          headerFont: showHeader === 'true' ? this.pxToEm(bannerHeaderFontSize) : '0px',
          footerFont: showFooter === 'true' ? this.pxToEm(bannerFooterFontSize) : '0px'
        };
      }

      return undefined;
    },
  },

  methods: {
    /**
     * Converts a pixel value to an em value based on the default font size.
     * @param {number} elementFontSize - The font size of the element in pixels.
     * @param {number} [defaultFontSize=14] - The default font size in pixels.
     * @returns {string} The converted value in em units.
     */
    pxToEm(elementFontSize, defaultFontSize = 14) {
      const lineHeightInPx = 2 * parseInt(elementFontSize);
      const lineHeightInEm = lineHeightInPx / defaultFontSize;

      return `${ lineHeightInEm }em`;
    },

    hide() {
      this.shown = false;
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
    getTooltipConfig(item) {
      if (!this.shown && !item) {
        return;
      }

      if (!this.shown) {
        return {
          content:       this.shown ? null : item,
          placement:     'right',
          popperOptions: { modifiers: { preventOverflow: { enabled: false }, hide: { enabled: false } } }
        };
      } else {
        return { content: undefined };
      }
    },
  }
};
</script>
<template>
  <div class="global-navigation">
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
        <Title
          :open="shown"
          @toggle="toggle()"
        />
        <Body :open="shown" />
        <Footer :open="shown" />
      </div>
    </transition>
  </div>
</template>

<style lang="scss">
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
</style>

<style lang="scss" scoped>
  $clear-search-size: 20px;
  $icon-size: 25px;
  $option-padding: 9px;
  $option-padding-left: 14px;
  $option-height: $icon-size + $option-padding + $option-padding;

  .global-navigation {
    width: $app-bar-collapsed-width;
  }

  .side-menu {
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
    transition: width 500ms;

    &:focus {
      outline: 0;
    }

     &.menu-open {
      width: 300px;
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
          .cluster-name {
            filter: grayscale(1);
            color: var(--muted);
          }

          .pin {
            cursor: pointer;
          }
        }

        &:focus {
          outline: 0;
          > div {
            text-decoration: underline;
          }
        }

        > i {
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
        img {
          margin-right: 16px;
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
        }

        &:hover {
          color: var(--primary-hover-text);
          background: var(--primary-hover-bg);
          > div {
            color: var(--primary-hover-text);
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

        .cluster-name {
          max-width: 220px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
