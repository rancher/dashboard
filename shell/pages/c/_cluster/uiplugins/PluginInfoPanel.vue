<script>
import { mapGetters } from 'vuex';
import ChartReadme from '@shell/components/ChartReadme';
import LazyImage from '@shell/components/LazyImage';
import genericPluginSvg from '~shell/assets/images/generic-plugin.svg';
import { getPluginChartVersionLabel, getPluginChartVersion } from '@shell/utils/uiplugins';
import { isChartVersionHigher, uiPluginHasAnnotation } from '@shell/config/uiplugins';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import Banner from '@components/Banner/Banner.vue';
import RcDrawer from '@components/RcDrawer/RcDrawer.vue';
import RcDrawerCard from '@components/RcDrawer/RcDrawerCard.vue';
import RcDrawerMessage from '@components/RcDrawer/RcDrawerMessage.vue';
import { useDrawerClose } from '@components/RcDrawer/composables';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter.vue';

export default {
  components: {
    Banner,
    ChartReadme,
    LazyImage,
    RcDrawer,
    RcDrawerCard,
    RcDrawerMessage,
    AppChartCardFooter
  },

  setup() {
    return { closeDrawer: useDrawerClose() };
  },

  props: {
    /**
     * The extension to describe, as built by the Extensions list.
     */
    info: {
      type:     Object,
      required: true
    },

    /**
     * Called with the chosen action when the user picks one from the footer.
     * The drawer is opened from a list page that owns the install/uninstall
     * dialogs, so the action is handed back rather than performed here.
     */
    onAction: {
      type:    Function,
      default: () => {}
    }
  },

  data() {
    return {
      infoVersion:  undefined,
      versionInfo:  undefined,
      versionError: undefined,
      defaultIcon:  genericPluginSvg,
    };
  },

  mounted() {
    this.loadPluginVersionInfo();
  },

  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),

    errorMessage() {
      return this.info?.installedError || (this.info?.helmError ? this.t('plugins.helmError') : null);
    },

    warningMessages() {
      const warnings = [];

      if (uiPluginHasAnnotation(this.info?.chart, CATALOG_ANNOTATIONS.DEPRECATED, 'true')) {
        warnings.push(this.t('plugins.deprecatedExtension'));
      }

      if (this.info?.incompatibilityMessage) {
        warnings.push(this.info.incompatibilityMessage);
      }

      return warnings;
    },

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
        // Pushed before the upgrade/downgrade action so that the footer reads
        // "Close | Uninstall | Upgrade": the last slot is the primary one in
        // every other drawer, and a destructive action does not belong there.
        if (!this.info.builtin) {
          actions.push({
            label:  this.t('plugins.uninstall.label'),
            action: 'uninstall',
            role:   'secondary',
            icon:   'icon-delete'
          });
        }

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
      }

      return actions;
    },

    /**
     * panelActions describes the actions; RcDrawer wants buttons. The two
     * differ only in that `action` is an identifier here and a callback there.
     */
    drawerActions() {
      return this.panelActions.map((button) => ({
        label:   button.label,
        icon:    button.icon,
        variant: button.role,
        action:  () => this.onButtonClick(button)
      }));
    }
  },

  methods: {
    onButtonClick(button) {
      this.onAction({ ...button, plugin: this.info });
      this.closeDrawer();
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
    :title="info.label"
    :actions="drawerActions"
  >
    <template #title>
      <span
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
      </span>
      <span data-testid="extension-details-title">{{ info.label }}</span>
    </template>

    <template #body>
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

      <RcDrawerCard>
        <p class="plugin-description">
          {{ info.description }}
        </p>

        <AppChartCardFooter
          v-if="info.tags && info.tags.length"
          :items="info.tags"
          class="plugin-tags-container"
        />

        <h3 class="plugin-versions-heading">
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

        <template v-if="!panelActions.length">
          <h3 class="plugin-versions-heading">
            {{ t('plugins.info.actions') }}
          </h3>
          <div class="no-actions">
            {{ t('plugins.info.noActions') }}
          </div>
        </template>
      </RcDrawerCard>

      <!--
        The two are exclusive by construction: loadPluginVersionInfo clears both
        before awaiting and only sets versionError in its catch.
      -->
      <RcDrawerCard v-if="versionError || versionInfo">
        <RcDrawerMessage
          v-if="versionError"
          icon="icon-warning"
        >
          {{ t('plugins.info.versionError') }}
        </RcDrawerMessage>
        <template v-else>
          <h3>{{ t('plugins.info.detail') }}</h3>
          <ChartReadme :version-info="versionInfo" />
        </template>
      </RcDrawerCard>
    </template>
  </RcDrawer>
</template>

<style lang="scss" scoped>
  .plugin-icon {
    align-items: center;
    display: inline-flex;
    justify-content: center;
    flex-shrink: 0;
    height: 32px;
    width: 32px;
    margin-right: 12px;
    border-radius: 4px;
    overflow: hidden;

    &.dark-mode {
      // Deliberately theme-independent: extension logos are authored for a
      // light background, so they need a white plate in dark mode. Same
      // treatment as SelectIconGrid.
      background-color: white;
    }

    .plugin-icon-img {
      height: 28px;
      width: 28px;
      object-fit: contain;
    }
  }

  .plugin-description {
    font-size: 15px;
    margin: 0;
  }

  .no-actions {
    color: var(--disabled-text);
  }

  .plugin-tags-container {
    margin-top: 16px;
  }

  .plugin-versions-heading {
    margin-top: 24px;
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

    &:focus-visible {
      @include focus-outline;
    }
  }
</style>
