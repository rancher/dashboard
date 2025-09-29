<script>
import { mapGetters } from 'vuex';
import ChartReadme from '@shell/components/ChartReadme';
import LazyImage from '@shell/components/LazyImage';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { useWatcherBasedSetupFocusTrapWithDestroyIncluded } from '@shell/composables/focusTrap';
import { getPluginChartVersionLabel, getPluginChartVersion } from '@shell/utils/uiplugins';
import { isChartVersionHigher } from '@shell/config/uiplugins';
import RcButton from '@components/RcButton/RcButton.vue';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter.vue';

export default {
  emits: ['action'],

  async fetch() {
    const bannerSetting = await this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.BANNERS);
    const { showHeader, bannerHeader } = JSON.parse(bannerSetting.value);

    if (showHeader === 'true') {
      const headerBannerFontSize = Number(bannerHeader?.fontSize?.split('px')[0] ?? 0);

      this.headerBannerSize = headerBannerFontSize * 2;
    }
  },
  components: {
    ChartReadme,
    LazyImage,
    RcButton,
    AppChartCardFooter
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

    panelActions() {
      const actions = [];

      if (!this.info) {
        return actions;
      }

      const selectedVersion = this.infoVersion;
      const installedVersion = this.info.installedVersion;

      if (!this.info.installed) {
        if (this.info.installableVersions?.length) {
          actions.push({
            label:   this.t('catalog.chart.chartButton.action.install'),
            action:  'install',
            role:    'primary',
            version: selectedVersion,
            icon:    'icon-plus'
          });
        }
      } else {
        if (selectedVersion && installedVersion && selectedVersion !== installedVersion) {
          if (isChartVersionHigher(selectedVersion, installedVersion)) {
            actions.push({
              label:   this.t('catalog.chart.chartButton.action.upgrade'),
              action:  'upgrade',
              role:    'primary',
              version: selectedVersion,
              icon:    'icon-upgrade-alt'
            });
          } else {
            actions.push({
              label:   this.t('catalog.chart.chartButton.action.downgrade'),
              action:  'downgrade',
              role:    'primary',
              version: selectedVersion,
              icon:    'icon-downgrade-alt'
            });
          }
        }

        if (!this.info.builtin) {
          actions.push({
            label:  this.t('plugins.uninstall.label'),
            action: 'uninstall',
            role:   'secondary',
            icon:   'icon-delete'
          });
        }
      }

      return actions;
    }
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
    onButtonClick(button) {
      this.$emit('action', { ...button, plugin: this.info });
      this.hide();
    },

    show(info) {
      this.info = info;
      this.showSlideIn = true;
      this.version = null;
      this.versionInfo = null;
      this.versionError = null;
      this.infoVersion = undefined;

      this.loadPluginVersionInfo();
    },

    hide() {
      this.showSlideIn = false;
    },

    async loadPluginVersionInfo(version) {
      const pluginChartVersion = getPluginChartVersion(this.info);

      const versionName = version || pluginChartVersion || this.info.versions?.[0]?.version;

      const isVersionNotCompatible = this.info.versions?.find((v) => versionName === (v.appVersion ?? v.version) && !v.isVersionCompatible);

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
    },

    getVersionLabel(version) {
      const label = getPluginChartVersionLabel(version);

      if (this.info.installed && version.version === this.info.installedVersion) {
        return `${ label } (${ this.t('plugins.labels.current') })`;
      }

      return label;
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
      <aside
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
                  @keydown.enter.space="hide()"
                >
                  <i class="icon icon-close" />
                </div>
              </div>
            </div>
          </div>
          <AppChartCardFooter
            v-if="info.tags && info.tags.length"
            :items="info.tags"
            class="plugin-tags-container"
          />

          <div class="plugin-versions-container">
            <h3>
              {{ t('plugins.info.versions') }}
            </h3>
            <div v-if="!info.versions.length">
              <div class="version-link version-active version-builtin">
                {{ info.displayVersion }}
              </div>
            </div>
            <div
              v-else
              class="plugin-versions"
            >
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
                  {{ getVersionLabel(v) }}
                </a>
              </div>
            </div>
          </div>
          <div class="plugin-actions-container">
            <h3>
              {{ t('plugins.info.actions') }}
            </h3>
            <div class="plugin-actions">
              <template v-if="panelActions.length">
                <RcButton
                  v-for="btn in panelActions"
                  :key="btn.action"
                  class="mmr-3 mmb-3"
                  :[btn.role]="true"
                  @click="onButtonClick(btn)"
                >
                  <i :class="['icon', btn.icon, 'mmr-2']" />{{ btn.label }}
                </RcButton>
              </template>
              <div
                v-else
                class="no-actions"
              >
                {{ t('plugins.info.noActions') }}
              </div>
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
        </div>
      </aside>
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
      padding: 12px;

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

        .banner.warning {
          margin-top: 0;
        }

        .plugin-info-detail {
          overflow: auto;
        }
      }

      h3 {
        font-size: 14px;
        margin-bottom: 12px;
        color: var(--disabled-text);
        text-transform: uppercase;
      }

      .plugin-header {
        border-bottom: 1px solid var(--border);
        display: flex;
        padding-bottom: 16px;
        margin-bottom: 16px;

        .plugin-title {
          flex: 1;
        }
      }

      .plugin-icon {
        font-size: 40px;
        margin-right: 12px;
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

      .plugin-tags-container {
        margin-top: -8px;
      }

      .plugin-tags-container,
      .plugin-versions-container,
      .plugin-actions-container {
        margin-bottom: 24px;
      }

      .plugin-versions,
      .plugin-actions {
        display: flex;
        flex-wrap: wrap;
      }

      .no-actions {
        color: var(--disabled-text);
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
        margin: 0 4px 4px 0;
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

        padding-bottom: 12px;

        :deep() .chart-readmes {
          flex: 1;
          overflow: auto;
        }
      }
    }
  }
</style>
