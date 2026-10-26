<script>
import { mapGetters } from 'vuex';
import ChartReadme from '@shell/components/ChartReadme';
import LazyImage from '@shell/components/LazyImage';
import { RcDrawer } from '@components/RcDrawer';
import genericPluginSvg from '~shell/assets/images/generic-plugin.svg';
import { getPluginChartVersionLabel, getPluginChartVersion, getLatestPluginVersions } from '@shell/utils/uiplugins';
import { isChartVersionHigher, uiPluginHasAnnotation } from '@shell/config/uiplugins';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import Banner from '@components/Banner/Banner.vue';
import RcButton from '@components/RcButton/RcButton.vue';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter.vue';

export default {
  emits: ['action', 'close'],

  components: {
    Banner,
    ChartReadme,
    RcDrawer,
    LazyImage,
    RcButton,
    AppChartCardFooter
  },

  props: {
    info: {
      type:     Object,
      required: true
    }
  },

  data() {
    return {
      infoVersion:     undefined,
      versionInfo:     undefined,
      versionError:    undefined,
      defaultIcon:     genericPluginSvg,
      showAllVersions: false
    };
  },
  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),

    errorMessage() {
      return this.info.installedError || (this.info.helmError ? this.t('plugins.helmError') : null);
    },

    warningMessages() {
      const warnings = [];

      if (uiPluginHasAnnotation(this.info.chart, CATALOG_ANNOTATIONS.DEPRECATED, 'true')) {
        warnings.push(this.t('plugins.deprecatedExtension'));
      }

      if (this.info.incompatibilityMessage) {
        warnings.push(this.info.incompatibilityMessage);
      }

      return warnings;
    },

    /**
     * Chart version the versions list is anchored on: the installed one, or the one the panel
     * pre-selects when the extension isn't installed
     */
    currentVersion() {
      if (this.info?.installed) {
        const installed = this.info.versions?.find((v) => this.info.installedVersion === (v.appVersion ?? v.version));

        return installed?.version || this.info.installedVersion;
      }

      return getPluginChartVersion(this.info);
    },

    displayedVersions() {
      const versions = this.info?.versions || [];

      if (this.showAllVersions) {
        return versions;
      }

      return getLatestPluginVersions(versions, this.currentVersion, [this.infoVersion]);
    },

    versionInTitle() {
      const selected = this.info?.versions?.find((v) => v.version === this.infoVersion);

      return selected ? this.t('plugins.info.titleVersion', { version: this.getVersionLabel(selected) }) : '';
    },

    drawerTitle() {
      return [this.info.label, this.versionInTitle].filter(Boolean).join(' ');
    },

    hasHiddenVersions() {
      return this.displayedVersions.length < (this.info?.versions?.length || 0);
    },

    applyDarkModeBg() {
      if (this.theme === 'dark') {
        return { 'dark-mode': true };
      }

      return {};
    },

    hasReadme() {
      return !!(this.versionInfo?.readme || this.versionInfo?.appReadme);
    },

    panelActions() {
      const actions = [];
      const selectedVersion = this.infoVersion;
      const installedVersion = this.info.installedVersion;

      if (!this.info.installed) {
        if (this.info.installableVersions?.length) {
          actions.push({
            label:   this.t('catalog.chart.chartButton.action.install'),
            action:  'install',
            role:    'primary',
            icon:    'plus',
            version: selectedVersion,
          });
        }
      } else {
        if (!this.info.builtin) {
          actions.push({
            label:  this.t('plugins.uninstall.label'),
            action: 'uninstall',
            role:   'secondary',
            icon:   'trash',
          });
        }

        if (selectedVersion && installedVersion && selectedVersion !== installedVersion) {
          if (isChartVersionHigher(selectedVersion, installedVersion)) {
            actions.push({
              label:   this.t('catalog.chart.chartButton.action.upgrade'),
              action:  'upgrade',
              role:    'primary',
              icon:    'upgrade-alt',
              version: selectedVersion,
            });
          } else {
            actions.push({
              label:   this.t('catalog.chart.chartButton.action.downgrade'),
              action:  'downgrade',
              role:    'primary',
              icon:    'downgrade-alt',
              version: selectedVersion,
            });
          }
        }
      }

      return actions;
    }
  },
  created() {
    this.loadPluginVersionInfo();
  },
  methods: {
    onButtonClick(button) {
      this.$emit('action', { ...button, plugin: this.info });
      this.$emit('close');
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
  <RcDrawer
    :title="drawerTitle"
    @close="$emit('close')"
  >
    <template #title>
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
      <span
        class="plugin-title"
        data-testid="extension-details-title"
      ><span class="plugin-name">{{ info.label }}</span>{{ versionInTitle ? ` ${ versionInTitle }` : '' }}</span>
    </template>
    <p class="plugin-description">
      {{ info.description }}
    </p>
    <AppChartCardFooter
      v-if="info.tags && info.tags.length"
      :items="info.tags"
      class="plugin-tags-container"
    />
    <Banner
      v-for="(msg, i) in warningMessages"
      :key="i"
      color="warning"
    >
      {{ msg }}
    </Banner>

    <Banner
      v-if="errorMessage"
      color="error"
    >
      {{ errorMessage }}
    </Banner>

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
          v-for="v in displayedVersions"
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
        <div v-if="hasHiddenVersions">
          <a
            class="version-link show-all-versions"
            data-testid="extension-details-show-all-versions"
            tabindex="0"
            role="button"
            @click="showAllVersions = true"
            @keyup.enter.space="showAllVersions = true"
          >
            {{ t('plugins.info.showAllVersions') }}
          </a>
        </div>
      </div>
    </div>

    <div v-if="versionError">
      {{ t('plugins.info.versionError') }}
    </div>
    <template v-if="hasReadme">
      <h3>
        {{ t('plugins.info.detail') }}
      </h3>
      <ChartReadme :version-info="versionInfo" />
    </template>
    <template #additional-actions>
      <RcButton
        v-for="btn in panelActions"
        :key="btn.action"
        size="large"
        :variant="btn.role"
        :left-icon="btn.icon"
        @click="onButtonClick(btn)"
      >
        {{ btn.label }}
      </RcButton>
    </template>
  </RcDrawer>
</template>
<style lang="scss" scoped>
  h3 {
    font-size: 14px;
    margin-bottom: 12px;
    color: var(--disabled-text);
    text-transform: uppercase;
  }

  .plugin-icon {
    flex-shrink: 0;
    margin-right: 12px;
    width: 40px;
    height: 40px;

    &.dark-mode {
      border-radius: calc(2 * var(--border-radius));
      overflow: hidden;
      background-color: white;
    }

    .plugin-icon-img {
      height: 36px;
      width: 36px;
      object-fit: contain;
      position: relative;
      top: 2px;
      left: 2px;
    }
  }

  .plugin-name {
    text-transform: capitalize;
  }

  .plugin-description {
    font-size: 15px;
    margin-bottom: 16px;
  }

  .plugin-tags-container,
  .plugin-versions-container {
    margin-bottom: 24px;
  }

  .banner.warning,
  .banner.error {
    margin-top: 0;
    margin-bottom: 24px;
  }

  .plugin-versions {
    display: flex;
    flex-wrap: wrap;
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

    &.show-all-versions {
      border: none;

      &:hover {
        text-decoration: underline;
      }
    }

    &:focus-visible {
      @include focus-outline;
    }
  }
</style>
