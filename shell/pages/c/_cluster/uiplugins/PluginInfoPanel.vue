<script>
import { mapGetters } from 'vuex';
import ChartReadme from '@shell/components/ChartReadme';
import { Banner } from '@components/Banner';
import LazyImage from '@shell/components/LazyImage';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { useWatcherBasedSetupFocusTrapWithDestroyIncluded } from '@shell/composables/focusTrap';

export default {
  async fetch() {
    const bannerSetting = await this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.BANNERS);
    const { showHeader, bannerHeader } = JSON.parse(bannerSetting.value);

    if (showHeader === 'true') {
      const headerBannerFontSize = Number(bannerHeader?.fontSize?.split('px')[0] ?? 0);

      this.headerBannerSize = headerBannerFontSize * 2;
    }
  },
  components: {
    Banner,
    ChartReadme,
    LazyImage
  },
  data() {
    return {
      showSlideIn:      false,
      info:             undefined,
      infoVersion:      undefined,
      versionInfo:      undefined,
      versionError:     undefined,
      defaultIcon:      require('~shell/assets/images/generic-plugin.svg'),
      headerBannerSize: 0,
      isActive:         false
    };
  },
  created() {
    useWatcherBasedSetupFocusTrapWithDestroyIncluded(() => this.showSlideIn, '#slide-in-content-element');
  },
  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),

    applyDarkModeBg() {
      if (this.theme === 'dark') {
        return { 'dark-mode': true };
      }

      return {};
    },
  },
  watch: {
    showSlideIn: {
      handler(neu) {
        // we register the global event on slidein visibility
        // so that it doesn't collide with other global events
        if (neu) {
          document.addEventListener('keyup', this.handleEscapeKey);
        } else {
          document.removeEventListener('keyup', this.handleEscapeKey);
        }
      },
      immediate: true
    }
  },
  methods: {
    show(info) {
      this.info = info;
      this.showSlideIn = true;
      this.version = null;
      this.versionInfo = null;
      this.versionError = null;

      this.loadPluginVersionInfo();
    },

    hide() {
      this.showSlideIn = false;
    },

    async loadPluginVersionInfo(version) {
      const versionName = version || this.info.displayVersion;

      const isVersionNotCompatible = this.info.versions?.find((v) => v.version === versionName && !v.isVersionCompatible);

      if (!this.info.chart || isVersionNotCompatible) {
        return;
      }

      this.infoVersion = versionName;

      this.versionError = false;
      this.versionInfo = undefined;

      try {
        this.versionInfo = await this.$store.dispatch('catalog/getVersionInfo', {
          repoType:  this.info.chart.repoType,
          repoName:  this.info.chart.repoName,
          chartName: this.info.chart.chartName,
          versionName
        });
        // Here we set us versionInfo. The returned
        // object contains everything all info
        // about a currently installed app, and it has the
        // following keys:
        //
        // - appReadme: A short overview of what the app does. This
        //   forms the first few paragraphs of the chart info when
        //   you install a Helm chart app through Rancher.
        // - chart: Metadata about the Helm chart, including the
        //   name and version.
        // - readme: This is more detailed information that appears
        //   under the heading "Chart Information (Helm README)" when
        //   you install or upgrade a Helm chart app through Rancher,
        //   below the app README.
        // - values: All Helm chart values for the currently installed
        //   app.
      } catch (e) {
        this.versionError = true;
        console.error('Unable to fetch VersionInfo: ', e); // eslint-disable-line no-console
      }
    },

    handleVersionBtnTooltip(version) {
      if (!version.isVersionCompatible && Object.keys(version.versionIncompatibilityData).length) {
        return this.t(version.versionIncompatibilityData?.tooltipKey, { required: version.versionIncompatibilityData?.required, mainHost: version.versionIncompatibilityData?.mainHost });
      }

      return '';
    },

    handleVersionBtnClass(version) {
      return { 'version-active': version.version === this.infoVersion, disabled: !version.isVersionCompatible };
    },

    onEnter() {
      this.isActive = true; // Set active state after the transition
    },

    onLeave() {
      this.isActive = false; // Remove active state when fully closed
    },

    handleEscapeKey(event) {
      event.stopPropagation();

      if (event.key === 'Escape') {
        this.hide();
      }
    }
  }
};
</script>
<template>
  <div
    class="plugin-info-panel"
    :style="`--banner-top-offset: ${headerBannerSize}px`"
  >
    <div
      v-if="showSlideIn"
      class="glass"
      data-testid="extension-details-bg"
      @click="hide()"
    />
    <transition
      name="slide"
      @after-enter="onEnter"
      @after-leave="onLeave"
    >
      <div
        v-if="showSlideIn"
        id="slide-in-content-element"
        class="slideIn"
        data-testid="extension-details"
        :class="{'active': isActive}"
      >
        <div
          v-if="info"
          class="plugin-info-content"
        >
          <div class="plugin-header">
            <div
              class="plugin-icon"
              :class="applyDarkModeBg"
            >
              <LazyImage
                v-if="info.icon"
                :initial-src="defaultIcon"
                :error-src="defaultIcon"
                :src="info.icon"
                class="icon plugin-icon-img"
              />
              <img
                v-else
                :src="defaultIcon"
                class="icon plugin-icon-img"
              >
            </div>
            <div class="plugin-title">
              <h2
                class="slideIn__header"
                data-testid="extension-details-title"
              >
                {{ info.label }}
              </h2>
              <p class="plugin-description">
                {{ info.description }}
              </p>
            </div>
            <div class="plugin-close">
              <div class="slideIn__header__buttons">
                <div
                  class="slideIn__header__button"
                  data-testid="extension-details-close"
                  role="button"
                  :aria-label="t('plugins.closePluginPanel')"
                  tabindex="0"
                  @click="hide()"
                  @keyup.enter.space="hide()"
                >
                  <i class="icon icon-close" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <Banner
              v-if="info.builtin"
              color="warning"
              :label="t('plugins.descriptions.built-in')"
              class="mt-10"
            />
            <template v-else>
              <Banner
                v-if="!info.certified"
                color="warning"
                :label="t('plugins.descriptions.third-party')"
                class="mt-10"
              />
              <Banner
                v-if="info.experimental"
                color="warning"
                :label="t('plugins.descriptions.experimental')"
                class="mt-10"
              />
            </template>
          </div>

          <h3 v-if="info.versions.length">
            {{ t('plugins.info.versions') }}
          </h3>
          <div class="plugin-versions mb-10">
            <div
              v-for="v in info.versions"
              :key="`${v.name}-${v.version}`"
            >
              <a
                v-clean-tooltip="handleVersionBtnTooltip(v)"
                class="version-link"
                :class="handleVersionBtnClass(v)"
                :tabindex="!v.isVersionCompatible ? -1 : 0"
                role="button"
                :aria-label="t('plugins.viewVersionDetails', {name: v.name, version: v.version})"
                @click="loadPluginVersionInfo(v.version)"
                @keyup.enter.space="loadPluginVersionInfo(v.version)"
              >
                {{ v.version }}
              </a>
            </div>
          </div>

          <div v-if="versionError">
            {{ t('plugins.info.versionError') }}
          </div>
          <h3 v-if="versionInfo">
            {{ t('plugins.info.detail') }}
          </h3>
          <div
            v-if="versionInfo"
            class="plugin-info-detail"
          >
            <ChartReadme
              v-if="versionInfo"
              :version-info="versionInfo"
            />
          </div>
          <div v-if="!info.versions.length">
            <h3>
              {{ t('plugins.info.versions') }}
            </h3>
            <div class="version-link version-active version-builtin">
              {{ info.displayVersion }}
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
<style lang="scss" scoped>
  .plugin-info-panel {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1;

    $slideout-width: 35%;
    $title-height: 50px;
    $padding: 5px;
    $slideout-width: 35%;
    --banner-top-offset: 0;
    $header-height: calc(54px + var(--banner-top-offset));

    .glass {
      z-index: 9;
      position: fixed;
      top: $header-height;
      height: calc(100% - $header-height);
      left: 0;
      width: 100%;
      opacity: 0;
    }

    .slideIn {
      border-left: var(--header-border-size) solid var(--header-border);
      position: fixed;
      top: $header-height;
      right: -$slideout-width;
      height: calc(100% - $header-height);
      background-color: var(--topmenu-bg);
      width: $slideout-width;
      z-index: 10;
      display: flex;
      flex-direction: column;
      padding: 10px;

      &.active {
        right: 0;
      }

      /* Enter animation */
      &.slide-enter-active {
        transition: right 0.5s ease; /* Animates both enter and leave */
      }

      &.slide-leave-active {
        transition: right 0.5s ease; /* Animates both enter and leave */
      }

      &.slide-enter-from,
      &.slide-leave-to {
        right: -$slideout-width; /* Off-screen position */
      }

      &.slide-enter-to,
      &.slide-leave-from {
        right: 0; /* Fully visible position */
      }

      &__header {
        text-transform: capitalize;
      }

      .plugin-info-content {
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .plugin-info-detail {
          overflow: auto;
        }
      }

      h3 {
        font-size: 14px;
        margin: 15px 0 10px 0;
        opacity: 0.7;
        text-transform: uppercase;
      }

      .plugin-header {
        border-bottom: 1px solid var(--border);
        display: flex;
        padding-bottom: 20px;

        .plugin-title {
          flex: 1;
        }
      }

      .plugin-icon {
        font-size: 40px;
        margin-right:10px;
        color: #888;
        width: 44px;
        height: 44px;

        &.dark-mode {
          border-radius: calc(2 * var(--border-radius));
          overflow: hidden;
          background-color: white;
        }

        .plugin-icon-img {
          height: 40px;
          width: 40px;
          -o-object-fit: contain;
          object-fit: contain;
          position: relative;
          top: 2px;
          left: 2px;
        }
      }

      .plugin-versions {
        display: flex;
        flex-wrap: wrap;
      }

      .plugin-description {
        font-size: 15px;
      }

      .version-link {
        cursor: pointer;
        border: 1px solid var(--link);
        padding: 2px 8px;
        border-radius: 5px;
        user-select: none;
        margin: 0 5px 5px 0;
        display: block;

        &.version-active {
          color: var(--link-text);
          background: var(--link);
        }

        &.disabled {
          cursor: not-allowed;
          color: var(--disabled-text) !important;
          background-color: var(--disabled-bg) !important;
          border-color: var(--disabled-bg) !important;
          text-decoration: none !important;
        }

        &.version-builtin {
          display: inline-block;
        }

        &:focus-visible {
          @include focus-outline;
        }
      }

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        &__buttons {
          display: flex;
        }

        &__button {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;

          > i {
            font-size: 20px;
            opacity: 0.5;
          }

          &:hover {
            background-color: var(--wm-closer-hover-bg);
          }

          &:focus-visible {
            @include focus-outline;
            outline-offset: -2px;
          }
        }
      }

      .chart-content__tabs {
        display: flex;
        flex-direction: column;
        flex: 1;

        height: 0;

        padding-bottom: 10px;

        :deep() .chart-readmes {
          flex: 1;
          overflow: auto;
        }
      }
    }
  }
</style>
