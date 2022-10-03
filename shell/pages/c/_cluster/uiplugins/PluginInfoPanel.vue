<script>
import ChartReadme from '@shell/components/ChartReadme';
import { Banner } from '@components/Banner';
import LazyImage from '@shell/components/LazyImage';

export default {
  components: {
    Banner,
    ChartReadme,
    LazyImage
  },

  data() {
    return {
      showSlideIn:  false,
      info:         undefined,
      infoVersion:  undefined,
      versionInfo:  undefined,
      versionError: undefined,
      defaultIcon:  require('~shell/assets/images/generic-plugin.svg'),
    };
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
      this.versionError = false;
      this.versionInfo = undefined;

      const versionName = version || this.info.displayVersion;

      this.infoVersion = versionName;

      if (!this.info.chart) {
        return;
      }

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
    }
  }
};
</script>
<template>
  <div class="plugin-info-panel">
    <div v-if="showSlideIn" class="glass" @click="hide()" />
    <div class="slideIn" :class="{'hide': false, 'slideIn__show': showSlideIn}">
      <div v-if="info">
        <div class="plugin-header">
          <div class="plugin-icon">
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
            />
          </div>
          <div class="plugin-title">
            <h2 class="slideIn__header">
              {{ info.name }}
            </h2>
            <p class="plugin-description">
              {{ info.description }}
            </p>
          </div>
          <div class="plugin-close">
            <div class="slideIn__header__buttons">
              <div class="slideIn__header__button" @click="showSlideIn = false">
                <i class="icon icon-close" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <Banner v-if="!info.certified" color="warning" :label="t('plugins.descriptions.third-party')" class="mt-10" />
          <Banner v-if="info.experimental" color="warning" :label="t('plugins.descriptions.experimental')" class="mt-10" />
        </div>

        <h3 v-if="info.versions">
          {{ t('plugins.info.versions') }}
        </h3>
        <div class="plugin-versions mb-10">
          <div v-for="v in info.versions" :key="v.version">
            <a
              class="version-link"
              :class="{'version-active': v.version === infoVersion}"
              @click="loadPluginVersionInfo(v.version)"
            >
              {{ v.version }}
            </a>
          </div>
        </div>

        <div v-if="versionError">
          {{ t('plugins.info.versionError') }}
        </div>
        <div v-else>
          <h3>
            {{ t('plugins.info.detail') }}
          </h3>
          <ChartReadme v-if="versionInfo" :version-info="versionInfo" />
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .plugin-info-panel {
    position: fixed;
    top: 0;
    left: 0;

    $slideout-width: 35%;
    $title-height: 50px;
    $padding: 5px;
    $slideout-width: 35%;
    $header-height: 54px;

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

      transition: right .5s ease;

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

        .plugin-icon-img {
          height: 40px;
          width: 40px;
        }
      }

      .plugin-versions {
        display: flex;
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
        margin-right: 5px;

        &.version-active {
          color: var(--link-text);
          background: var(--link);
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
        }
      }

      .chart-content__tabs {
        display: flex;
        flex-direction: column;
        flex: 1;

        height: 0;

        padding-bottom: 10px;

        ::v-deep .chart-readmes {
          flex: 1;
          overflow: auto;
        }
      }

      &__show {
        right: 0;
      }
    }
  }
</style>
