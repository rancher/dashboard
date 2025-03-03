<script>
import { mapGetters } from 'vuex';
import { mapPref, PLUGIN_DEVELOPER } from '@shell/store/prefs';
import { sortBy } from '@shell/utils/sort';
import { allHash } from '@shell/utils/promise';
import { CATALOG, UI_PLUGIN, MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { fetchOrCreateSetting } from '@shell/utils/settings';
import { getVersionData, isRancherPrime } from '@shell/config/version';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { NAME as APP_PRODUCT } from '@shell/config/product/apps';
import ActionMenu from '@shell/components/ActionMenuShell';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import IconMessage from '@shell/components/IconMessage.vue';
import LazyImage from '@shell/components/LazyImage';
import { BadgeState } from '@components/BadgeState';
import UninstallDialog from './UninstallDialog.vue';
import InstallDialog from './InstallDialog.vue';
import CatalogLoadDialog from './CatalogList/CatalogLoadDialog.vue';
import CatalogUninstallDialog from './CatalogList/CatalogUninstallDialog.vue';
import DeveloperInstallDialog from './DeveloperInstallDialog.vue';
import PluginInfoPanel from './PluginInfoPanel.vue';
import SetupUIPlugins from './SetupUIPlugins.vue';
import AddExtensionRepos from './AddExtensionRepos';
import CatalogList from './CatalogList/index.vue';
import Banner from '@components/Banner/Banner.vue';
import {
  isUIPlugin,
  uiPluginAnnotation,
  uiPluginHasAnnotation,
  isSupportedChartVersion,
  isChartVersionHigher,
  UI_PLUGIN_NAMESPACE,
  UI_PLUGIN_CHART_ANNOTATIONS,
  UI_PLUGINS_REPOS,
  EXTENSIONS_INCOMPATIBILITY_TYPES
} from '@shell/config/uiplugins';
import TabTitle from '@shell/components/TabTitle';
import versions from '@shell/utils/versions';

const MAX_DESCRIPTION_LENGTH = 200;

const TABS_VALUES = {
  INSTALLED: 'installed',
  UPDATES:   'updates',
  AVAILABLE: 'available',
  BUILTIN:   'builtin',
  ALL:       'all',
};

export default {
  components: {
    ActionMenu,
    BadgeState,
    DeveloperInstallDialog,
    IconMessage,
    CatalogList,
    Banner,
    CatalogLoadDialog,
    CatalogUninstallDialog,
    InstallDialog,
    LazyImage,
    PluginInfoPanel,
    Tab,
    Tabbed,
    UninstallDialog,
    SetupUIPlugins,
    AddExtensionRepos,
    TabTitle
  },

  data() {
    return {
      TABS_VALUES,
      kubeVersion:                    null,
      view:                           '',
      installing:                     {},
      errors:                         {},
      plugins:                        [], // The installed plugins
      helmOps:                        [], // Helm operations
      addExtensionReposBannerSetting: undefined,
      loading:                        true,
      menuTargetElement:              null,
      menuTargetEvent:                null,
      menuOpen:                       false,
      hasFeatureFlag:                 true,
      defaultIcon:                    require('~shell/assets/images/generic-plugin.svg'),
      reloadRequired:                 false,
      rancherVersion:                 null,
      showCatalogList:                false
    };
  },

  async fetch() {
    const hash = {};

    const isSetup = await this.updateInstallStatus(true);

    if (isSetup) {
      if (this.$store.getters['management/schemaFor'](UI_PLUGIN)) {
        hash.plugins = this.$store.dispatch('management/findAll', { type: UI_PLUGIN });
      }
    }

    hash.load = this.$store.dispatch('catalog/load', { reset: true });

    if (this.$store.getters['management/schemaFor'](MANAGEMENT.CLUSTER)) {
      hash.localCluster = this.$store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id: 'local' });
    }

    if (this.$store.getters['management/schemaFor'](CATALOG.OPERATION)) {
      hash.helmOps = this.$store.dispatch('management/findAll', { type: CATALOG.OPERATION });
    }

    if (this.$store.getters['management/schemaFor'](CATALOG.CLUSTER_REPO)) {
      hash.repos = this.$store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO }, { force: true });
    }

    hash.versions = versions.fetch({ store: this.$store });

    const res = await allHash(hash);

    this.rancherVersion = getVersionData()?.Version;
    this.plugins = res.plugins || [];
    this.repos = res.repos || [];
    this.helmOps = res.helmOps || [];
    this.kubeVersion = res.localCluster?.kubernetesVersionBase || [];

    this.addExtensionReposBannerSetting = await fetchOrCreateSetting(this.$store, SETTING.ADD_EXTENSION_REPOS_BANNER_DISPLAY, 'true', true) || {};

    // If there are no plugins installed, default to the catalog view
    if (this.plugins.length === 0) {
      this.$refs.tabs?.select(TABS_VALUES.AVAILABLE);
    }

    this.loading = false;
  },

  computed: {
    pluginDeveloper: mapPref(PLUGIN_DEVELOPER),

    ...mapGetters({ uiplugins: 'uiplugins/plugins' }),
    ...mapGetters({ uiErrors: 'uiplugins/errors' }),
    ...mapGetters({ theme: 'prefs/theme' }),

    charts() {
      const c = this.$store.getters['catalog/rawCharts'];

      if ( c ) {
        return Object.values(c);
      }

      return null;
    },

    showAddReposBanner() {
      // because of https://github.com/rancher/rancher/pull/45894 we need to consider other start values
      const hasExtensionReposBannerSetting = this.addExtensionReposBannerSetting?.value === 'true' || this.addExtensionReposBannerSetting?.value === '' || this.addExtensionReposBannerSetting?.value === undefined;
      const uiPluginsRepoNotFound = isRancherPrime() && !this.repos?.find((r) => r.urlDisplay === UI_PLUGINS_REPOS.OFFICIAL.URL);
      const uiPluginsPartnersRepoNotFound = !this.repos?.find((r) => r.urlDisplay === UI_PLUGINS_REPOS.PARTNERS.URL);

      return hasExtensionReposBannerSetting && (uiPluginsRepoNotFound || uiPluginsPartnersRepoNotFound);
    },

    applyDarkModeBg() {
      if (this.theme === 'dark') {
        return { 'dark-mode': true };
      }

      return {};
    },

    menuActions() {
      const menuActions = [];

      // Add link to go to the Repos view of the local cluster
      menuActions.push({
        action:  'manageRepos',
        label:   this.t('plugins.manageRepos'),
        enabled: true
      });

      // Add link to add extensions repositories (Official, Partners, etc)
      menuActions.push({
        action:  'addRancherRepos',
        label:   this.t('plugins.addRancherRepos'),
        enabled: true
      });

      // Only show Manage Extension Catalogs when on main charts view
      if (!this.showCatalogList) {
        menuActions.push({
          action:  'manageExtensionView',
          label:   this.t('plugins.manageCatalog.label'),
          enabled: true
        });
      }

      // Only show Developer Load action if the user has this enabled in preferences
      if (this.pluginDeveloper) {
        menuActions.push( { divider: true });
        menuActions.push({
          action:  'devLoad',
          label:   this.t('plugins.developer.label'),
          enabled: true
        });
      }

      return menuActions;
    },

    list() {
      // If not an extension developer, then don't include built-in extensions
      const all = this.pluginDeveloper ? this.available : this.available.filter((p) => !p.builtin);

      switch (this.view) {
      case TABS_VALUES.INSTALLED:
        // We never show built-in extensions as installed - installed are just the ones the user has installed
        return all.filter((p) => !p.builtin && (!!p.installed || !!p.installing));
      case TABS_VALUES.UPDATES:
        return this.updates;
      case TABS_VALUES.AVAILABLE:
        return all.filter((p) => !p.installed);
      case TABS_VALUES.BUILTIN:
        return all.filter((p) => p.builtin);
      default:
        return all;
      }
    },

    hasMenuActions() {
      return this.menuActions?.length > 0;
    },

    // Message to display when the tab view is empty (depends on the tab)
    emptyMessage() {
      // i18n-uses plugins.empty.*
      return this.t(`plugins.empty.${ this.view }`);
    },

    updates() {
      return this.available.filter((plugin) => !!plugin.upgrade);
    },

    available() {
      let all = this.charts.filter((c) => isUIPlugin(c));

      // Filter out hidden charts
      all = all.filter((c) => !uiPluginHasAnnotation(c, CATALOG_ANNOTATIONS.HIDDEN, 'true'));

      all = all.map((chart) => {
        // Label can be overridden by chart annotation
        const label = uiPluginAnnotation(chart, UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME) || chart.chartNameDisplay;
        const item = {
          name:         chart.chartName,
          label,
          description:  chart.chartDescription,
          id:           chart.id,
          versions:     [],
          installed:    false,
          builtin:      false,
          experimental: uiPluginHasAnnotation(chart, CATALOG_ANNOTATIONS.EXPERIMENTAL, 'true'),
          certified:    uiPluginHasAnnotation(chart, CATALOG_ANNOTATIONS.CERTIFIED, CATALOG_ANNOTATIONS._RANCHER)
        };

        item.versions = [...chart.versions];
        item.chart = chart;
        item.incompatibilityMessage = '';

        // Filter the versions available to install (plugins-api version and current dashboard version)
        item.installableVersions = item.versions.filter((version) => isSupportedChartVersion({
          version, rancherVersion: this.rancherVersion, kubeVersion: this.kubeVersion
        }));

        // add prop to version object if version is compatible with the current dashboard version
        item.versions = item.versions.map((version) => isSupportedChartVersion({
          version, rancherVersion: this.rancherVersion, kubeVersion: this.kubeVersion
        }, true));

        const latestCompatible = item.installableVersions?.[0];
        const latestNotCompatible = item.versions.find((version) => !version.isVersionCompatible);

        if (latestCompatible) {
          item.displayVersion = latestCompatible.version;
          item.icon = latestCompatible.icon;
        } else {
          item.displayVersion = item.versions?.[0]?.version;
          item.icon = chart.icon || latestCompatible?.annotations?.['catalog.cattle.io/ui-icon'];
        }

        // add message of extension card if there's a newer version of the extension, but it's not available to be installed
        if (latestNotCompatible && item.installableVersions.length && isChartVersionHigher(latestNotCompatible.version, item.installableVersions?.[0].version)) {
          switch (latestNotCompatible.versionIncompatibilityData?.type) {
          case EXTENSIONS_INCOMPATIBILITY_TYPES.HOST:
            item.incompatibilityMessage = this.t(latestNotCompatible.versionIncompatibilityData?.cardMessageKey, {
              version: latestNotCompatible.version, required: latestNotCompatible.versionIncompatibilityData?.required, mainHost: latestNotCompatible.versionIncompatibilityData?.mainHost
            }, true);
            break;
          default:
            item.incompatibilityMessage = this.t(latestNotCompatible.versionIncompatibilityData?.cardMessageKey, {
              version:  latestNotCompatible.version,
              required: latestNotCompatible.versionIncompatibilityData?.required
            }, true);
            break;
          }
        }

        if (this.installing[item.name]) {
          item.installing = this.installing[item.name];
        }

        return item;
      });

      // Remove charts with no installable versions
      all = all.filter((c) => c.versions.length > 0);

      // Check that all of the loaded plugins are represented
      this.uiplugins.forEach((p) => {
        const chart = all.find((c) => c.name === p.name);

        if (!chart) {
          // A plugin is loaded, but there is no chart, so add an item so that it shows up
          const rancher = typeof p.metadata?.rancher === 'object' ? p.metadata.rancher : {};
          const label = rancher.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME] || p.name;
          const item = {
            name:           p.name,
            label,
            description:    p.metadata?.description,
            icon:           p.metadata?.icon,
            id:             p.id,
            versions:       [],
            displayVersion: p.metadata?.version || '-',
            installed:      true,
            builtin:        !!p.builtin,
          };

          // Built-in plugins can chose to be hidden - used where we implement as extensions
          // but don't want to shows them individually on the extensions page
          if (!(item.builtin && rancher[UI_PLUGIN_CHART_ANNOTATIONS.HIDDEN_BUILTIN])) {
            all.push(item);
          }
        }
      });

      // Go through the CRs for the plugins and wire them into the catalog
      this.plugins.forEach((p) => {
        const chart = all.find((c) => c.name === p.name);

        if (chart) {
          chart.installed = true;
          chart.uiplugin = p;
          chart.displayVersion = p.version;

          // Can't do this here
          chart.installing = this.installing[chart.name];

          // Check for upgrade
          if (chart.installableVersions?.length && p.version !== chart.installableVersions?.[0]?.version) {
            chart.upgrade = chart.installableVersions[0].version;
          }
        } else {
          // No chart, so add a card for the plugin based on its Custom resource being present
          const item = {
            name:           p.name,
            label:          p.name,
            description:    p.description || '-',
            id:             `${ p.name }-${ p.version }`,
            versions:       [],
            displayVersion: p.version || '-',
            installed:      true,
            installing:     false,
            builtin:        false,
            uiplugin:       p,
          };

          all.push(item);
        }
      });

      // Merge in the plugin load errors
      Object.keys(this.uiErrors).forEach((e) => {
        const chart = all.find((c) => c.name === e);

        if (chart) {
          const error = this.uiErrors[e];

          if (error && typeof error === 'string') {
            chart.installedError = this.t(this.uiErrors[e]);
          } else {
            chart.installedError = '';
          }
        }
      });

      // Merge in the plugin load errors from help ops
      Object.keys(this.errors).forEach((e) => {
        const chart = all.find((c) => c.name === e);

        if (chart) {
          chart.helmError = !!this.errors[e];
        }
      });

      all.forEach((plugin) => {
        // Clamp the lengths of the descriptions
        if (plugin.description && plugin.description.length > MAX_DESCRIPTION_LENGTH) {
          plugin.description = `${ plugin.description.substr(0, MAX_DESCRIPTION_LENGTH) } ...`;
        }
      });

      // Sort by name
      return sortBy(all, 'name', false);
    }
  },

  watch: {
    helmOps: {
      handler(neu) {
      // Get Helm operations for UI plugins and order by date
        let pluginOps = neu.filter((op) => {
          return op.namespace === UI_PLUGIN_NAMESPACE;
        });

        pluginOps = sortBy(pluginOps, 'metadata.creationTimestamp', true);

        // Go through the installed plugins
        (this.available || []).forEach((plugin) => {
          const op = pluginOps.find((o) => o.status?.releaseName === plugin.name);

          if (op) {
            const active = op.metadata.state?.transitioning;
            const error = op.metadata.state?.error;

            this.errors[plugin.name] = error;

            if (active) {
            // Can use the status directly, apart from upgrade, which maps to install
              const status = op.status.action === 'upgrade' ? 'install' : op.status.action;

              this.updatePluginInstallStatus(plugin.name, status);
            } else if (op.status.action === 'uninstall') {
            // Uninstall has finished
              this.updatePluginInstallStatus(plugin.name, false);
            } else if (error) {
              this.updatePluginInstallStatus(plugin.name, false);
            }
          } else {
            this.updatePluginInstallStatus(plugin.name, false);
          }
        });
      },
      deep: true
    },

    plugins: {
      handler(neu) {
        const installed = this.$store.getters['uiplugins/plugins'];
        const shouldHaveLoaded = (installed || []).filter((p) => !this.uiErrors[p.name] && !p.builtin);
        let changes = 0;

        // Did the user remove an extension
        if (neu?.length < shouldHaveLoaded.length) {
          changes++;
        }

        neu.forEach((plugin) => {
          const existing = installed.find((p) => !p.removed && p.name === plugin.name && p.version === plugin.version);

          if (!existing && plugin.isInitialized) {
            if (!this.uiErrors[plugin.name]) {
              changes++;
            }

            this.updatePluginInstallStatus(plugin.name, false);
          }
        });

        if (changes > 0) {
          this['reloadRequired'] = true;
        }
      },
      deep: true
    }
  },

  // Forget the types when we leave the page
  beforeUnmount() {
    this.$store.dispatch('management/forgetType', UI_PLUGIN);
    this.$store.dispatch('management/forgetType', CATALOG.OPERATION);
    this.$store.dispatch('management/forgetType', CATALOG.APP);
    this.$store.dispatch('management/forgetType', CATALOG.CLUSTER_REPO);
  },

  methods: {
    async refreshCharts(forceChartsUpdate = false) {
      // we might need to force the request, so that we know at all times if what's the status of the offical and partners repos (installed or not)
      // tied to the SetupUIPlugins, AddExtensionRepos checkboxes
      await this.$store.dispatch('catalog/load', { reset: true, force: forceChartsUpdate });
    },

    async updateInstallStatus(forceChartsUpdate = false) {
      let hasFeatureFlag;

      try {
        hasFeatureFlag = this.$store.getters['features/get']('uiextension');
      } catch (e) {
        console.warn('Failed to check for feature flag', e); // eslint-disable-line no-console
        hasFeatureFlag = false;
      }

      if ( hasFeatureFlag || forceChartsUpdate ) {
        this.refreshCharts(forceChartsUpdate);
      }

      this['hasFeatureFlag'] = hasFeatureFlag;

      return hasFeatureFlag;
    },

    filterChanged(f) {
      this.view = f.selectedName;
    },

    // Developer Load is in the action menu
    showDeveloperLoadDialog() {
      this.$refs.developerInstallDialog.showDialog();
    },

    showAddExtensionReposDialog() {
      this.updateAddReposSetting();
      this.refreshCharts(true);
      this.$refs.addExtensionReposDialog.showDialog();
    },

    showCatalogLoadDialog() {
      this.$refs.catalogLoadDialog.showDialog();
    },

    showCatalogUninstallDialog(ev) {
      this.$refs.catalogUninstallDialog.showDialog(ev);
    },

    showInstallDialog(plugin, mode, ev) {
      ev.target?.blur();
      ev.preventDefault();
      ev.stopPropagation();

      this.$refs.installDialog.showDialog(plugin, mode);
    },

    showUninstallDialog(plugin, ev) {
      ev.target?.blur();
      ev.preventDefault();
      ev.stopPropagation();

      this.$refs.uninstallDialog.showDialog(plugin);
    },

    didUninstall(plugin) {
      if (plugin) {
        this.updatePluginInstallStatus(plugin.name, 'uninstall');

        if (plugin.catalog) {
          this.refreshCharts();
        }

        // Clear the load error, if there was one
        this.$store.dispatch('uiplugins/setError', { name: plugin.name, error: false });
      }
    },

    didInstall(plugin) {
      if (plugin) {
        // Change the view to installed if we started installing a plugin
        this.$refs.tabs?.select(TABS_VALUES.INSTALLED);

        // Clear the load error, if there was one previously
        this.$store.dispatch('uiplugins/setError', { name: plugin.name, error: false });
      }
    },

    showPluginDetail(plugin) {
      this.$refs.infoPanel.show(plugin);
    },

    updatePluginInstallStatus(name, status) {
      this.installing[name] = status;
    },

    setMenu(event) {
      this.menuOpen = !!event;

      if (event) {
        this.menuTargetElement = this.$refs.actions;
        this.menuTargetEvent = event;
      } else {
        this.menuTargetElement = undefined;
        this.menuTargetEvent = undefined;
      }
    },

    reload() {
      this.$router.go();
    },

    manageRepos() {
      this.$router.push({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  'local',
          product:  APP_PRODUCT,
          resource: CATALOG.CLUSTER_REPO
        }
      });
    },

    manageExtensionView() {
      this.showCatalogList = !this.showCatalogList;
    },

    updateAddReposSetting() {
      // because of https://github.com/rancher/rancher/pull/45894 we need to consider other start values
      if (this.addExtensionReposBannerSetting?.value === 'true' || this.addExtensionReposBannerSetting?.value === '' || this.addExtensionReposBannerSetting?.value === undefined) {
        this.addExtensionReposBannerSetting.value = 'false';
        this.addExtensionReposBannerSetting.save();
      }
    }
  }
};
</script>

<template>
  <div
    id="extensions-main-page"
    class="plugins"
  >
    <div class="plugin-header">
      <!-- catalog view header -->
      <template v-if="showCatalogList">
        <div class="catalog-title">
          <h2
            class="mb-0 mr-10"
            data-testid="extensions-catalog-title"
          >
            <a
              class="link"
              role="link"
              tabindex="0"
              :aria-label="t('plugins.manageCatalog.title')"
              @click="manageExtensionView()"
            >
              {{ t('plugins.manageCatalog.title') }}:
            </a>
            <t k="plugins.manageCatalog.subtitle" />
          </h2>
          <BadgeState
            color="bg-warning"
            :label="t('generic.experimental')"
            class="badge"
          />
        </div>
      </template>
      <!-- normal extensions view header -->
      <template v-else>
        <h2 data-testid="extensions-page-title">
          <TabTitle breadcrumb="vendor-only">
            {{ t('plugins.title') }}
          </TabTitle>
        </h2>
      </template>
      <div class="actions-container">
        <!-- extensions reload toast/notification -->
        <div
          v-if="reloadRequired"
          class="plugin-reload-banner mr-20"
          data-testid="extension-reload-banner"
        >
          <i class="icon icon-checkmark mr-10" />
          <span>
            {{ t('plugins.reload') }}
          </span>
          <button
            class="ml-10 btn btn-sm role-primary"
            data-testid="extension-reload-banner-reload-btn"
            role="button"
            :aria-label="t('plugins.labels.reloadRancher')"
            @click="reload()"
          >
            {{ t('generic.reload') }}
          </button>
        </div>
        <!-- extensions menu -->
        <div v-if="hasFeatureFlag && hasMenuActions">
          <ActionMenu
            data-testid="extensions-page-menu"
            button-role="tertiary"
            :button-aria-label="t('plugins.labels.menu')"
            :custom-actions="menuActions"
            @devLoad="showDeveloperLoadDialog"
            @manageRepos="manageRepos"
            @addRancherRepos="showAddExtensionReposDialog"
            @manageExtensionView="manageExtensionView"
          />
        </div>
      </div>
    </div>

    <!-- extensions slide-in panel -->
    <PluginInfoPanel ref="infoPanel" />

    <!-- extensions not enabled by feature flag -->
    <div v-if="!hasFeatureFlag">
      <div
        v-if="loading"
        class="data-loading"
      >
        <i class="icon-spin icon icon-spinner" />
        <t
          k="generic.loading"
          :raw="true"
        />
      </div>
      <SetupUIPlugins
        v-else
        class="setup-message"
        :has-feature-flag="hasFeatureFlag"
        @done="updateInstallStatus(true)"
        @refreshCharts="refreshCharts(true)"
      />
    </div>
    <div v-else>
      <!-- Extension Catalog list view -->
      <template v-if="showCatalogList">
        <CatalogList
          @showCatalogLoadDialog="showCatalogLoadDialog"
          @showCatalogUninstallDialog="showCatalogUninstallDialog($event)"
        />
      </template>
      <template v-else>
        <Banner
          v-if="showAddReposBanner"
          color="warning"
          class="add-repos-banner mb-20"
          data-testid="extensions-new-repos-banner"
        >
          <span>{{ t('plugins.addRepos.banner', {}, true) }}</span>
          <button
            class="ml-10 btn btn-sm role-primary"
            data-testid="extensions-new-repos-banner-action-btn"
            role="button"
            :aria-label="t('plugins.addRepos.bannerBtn')"
            @click="showAddExtensionReposDialog()"
          >
            {{ t('plugins.addRepos.bannerBtn') }}
          </button>
        </Banner>

        <Tabbed
          ref="tabs"
          :tabs-only="true"
          data-testid="extension-tabs"
          @changed="filterChanged"
        >
          <Tab
            :name="TABS_VALUES.INSTALLED"
            data-testid="extension-tab-installed"
            label-key="plugins.tabs.installed"
            :weight="20"
          />
          <Tab
            :name="TABS_VALUES.AVAILABLE"
            data-testid="extension-tab-available"
            label-key="plugins.tabs.available"
            :weight="19"
          />
          <Tab
            :name="TABS_VALUES.UPDATES"
            label-key="plugins.tabs.updates"
            :weight="18"
            :badge="updates.length"
          />
          <Tab
            v-if="pluginDeveloper"
            :name="TABS_VALUES.BUILTIN"
            label-key="plugins.tabs.builtin"
            :weight="17"
          />
          <Tab
            :name="TABS_VALUES.ALL"
            label-key="plugins.tabs.all"
            :weight="16"
          />
        </Tabbed>
        <div
          v-if="loading"
          class="data-loading"
        >
          <i class="icon-spin icon icon-spinner" />
          <t
            k="generic.loading"
            :raw="true"
          />
        </div>
        <div
          v-else
          class="plugin-list"
          :class="{'v-margin': !list.length}"
        >
          <IconMessage
            v-if="list.length === 0"
            :vertical="true"
            :subtle="true"
            icon="icon-extension"
            :message="emptyMessage"
          />
          <template v-else>
            <!-- extension card! -->
            <div
              v-for="(plugin, i) in list"
              :id="`list-item-${i}`"
              :key="i"
              class="plugin"
              :data-testid="`extension-card-${plugin.name}`"
              role="button"
              tabindex="0"
              :aria-label="plugin.name || ''"
              @click="showPluginDetail(plugin)"
              @keyup.enter.space="showPluginDetail(plugin)"
            >
              <!-- extension icon -->
              <div
                class="plugin-icon"
                :class="applyDarkModeBg"
              >
                <LazyImage
                  v-if="plugin.icon"
                  :initial-src="defaultIcon"
                  :error-src="defaultIcon"
                  :src="plugin.icon"
                  class="icon plugin-icon-img"
                  :alt="t('plugins.altIcon', { extension: plugin.name })"
                />
                <img
                  v-else
                  :src="defaultIcon"
                  class="icon plugin-icon-img"
                  :alt="t('plugins.altIcon', { extension: plugin.name })"
                >
              </div>
              <!-- extension card -->
              <div class="plugin-metadata">
                <!-- extension basic info -->
                <div class="plugin-name">
                  {{ plugin.label }}
                </div>
                <div>{{ plugin.description }}</div>
                <!-- extension version info and error display -->
                <div class="plugin-version">
                  <span
                    v-if="plugin.installing"
                    class="plugin-installing"
                  >
                    -
                  </span>
                  <span v-else>
                    <span>{{ plugin.displayVersion }}</span>
                    <span
                      v-if="plugin.upgrade"
                      v-clean-tooltip="t('plugins.upgradeAvailable')"
                    > -> {{ plugin.upgrade }}</span>
                    <p
                      v-if="plugin.installedError"
                      class="install-error"
                    >
                      <i class="icon icon-warning icon-lg" />
                      <span>{{ plugin.installedError }}</span>
                    </p>
                    <p
                      v-else-if="plugin.incompatibilityMessage"
                      class="incompatible"
                    >{{ plugin.incompatibilityMessage }}</p>
                  </span>
                </div>
                <!-- extension badges -->
                <div
                  v-if="plugin.builtin"
                  class="plugin-badges"
                >
                  <div class="plugin-builtin">
                    {{ t('plugins.labels.builtin') }}
                  </div>
                </div>
                <div
                  v-else
                  class="plugin-badges"
                >
                  <div
                    v-if="!plugin.certified"
                    v-clean-tooltip="t('plugins.descriptions.third-party')"
                  >
                    {{ t('plugins.labels.third-party') }}
                  </div>
                  <div
                    v-if="plugin.experimental"
                    v-clean-tooltip="t('plugins.descriptions.experimental')"
                  >
                    {{ t('plugins.labels.experimental') }}
                  </div>
                </div>
                <div class="plugin-spacer" />
                <!-- extension actions -->
                <div class="plugin-actions">
                  <!-- extension status -->
                  <div
                    v-if="plugin.helmError"
                    v-clean-tooltip="t('plugins.helmError')"
                    class="plugin-error"
                  >
                    <i class="icon icon-warning" />
                  </div>

                  <div class="plugin-spacer" />

                  <div
                    v-if="plugin.installing"
                    class="plugin-installing"
                  >
                    <i class="version-busy icon icon-spin icon-spinner" />
                    <div v-if="plugin.installing ==='install'">
                      {{ t('plugins.labels.installing') }}
                    </div>
                    <div v-else>
                      {{ t('plugins.labels.uninstalling') }}
                    </div>
                  </div>
                  <!-- extension buttons -->
                  <div
                    v-else-if="plugin.installed"
                    class="plugin-buttons"
                  >
                    <button
                      v-if="!plugin.builtin"
                      class="btn role-secondary"
                      :data-testid="`extension-card-uninstall-btn-${plugin.name}`"
                      role="button"
                      :aria-label="t('plugins.uninstall.label')"
                      @click.stop="showUninstallDialog(plugin, $event)"
                      @keyup.space.stop="showUninstallDialog(plugin, $event)"
                    >
                      {{ t('plugins.uninstall.label') }}
                    </button>
                    <button
                      v-if="plugin.upgrade"
                      class="btn role-secondary"
                      :data-testid="`extension-card-update-btn-${plugin.name}`"
                      role="button"
                      :aria-label="t('plugins.update.label')"
                      @click.stop="showInstallDialog(plugin, 'update', $event)"
                      @keyup.space.stop="showInstallDialog(plugin, 'update', $event)"
                    >
                      {{ t('plugins.update.label') }}
                    </button>
                    <button
                      v-if="!plugin.upgrade && plugin.installableVersions && plugin.installableVersions.length > 1"
                      class="btn role-secondary"
                      :data-testid="`extension-card-rollback-btn-${plugin.name}`"
                      role="button"
                      :aria-label="t('plugins.rollback.label')"
                      @click.stop="showInstallDialog(plugin, 'rollback', $event)"
                      @keyup.space.stop="showInstallDialog(plugin, 'rollback', $event)"
                    >
                      {{ t('plugins.rollback.label') }}
                    </button>
                  </div>
                  <div
                    v-else-if="plugin.installableVersions && plugin.installableVersions.length"
                    class="plugin-buttons"
                  >
                    <button
                      class="btn role-secondary"
                      :data-testid="`extension-card-install-btn-${plugin.name}`"
                      role="button"
                      :aria-label="t('plugins.install.label')"
                      @click.stop="showInstallDialog(plugin, 'install', $event)"
                      @keyup.space.stop="showInstallDialog(plugin, 'install', $event)"
                    >
                      {{ t('plugins.install.label') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>

    <InstallDialog
      ref="installDialog"
      @closed="didInstall"
      @update="updatePluginInstallStatus"
    />
    <UninstallDialog
      ref="uninstallDialog"
      @closed="didUninstall"
      @update="updatePluginInstallStatus"
    />
    <CatalogLoadDialog
      ref="catalogLoadDialog"
      @closed="didInstall"
      @refresh="() => reloadRequired = true"
    />
    <CatalogUninstallDialog
      ref="catalogUninstallDialog"
      @closed="didUninstall"
      @refresh="() => reloadRequired = true"
    />
    <DeveloperInstallDialog
      ref="developerInstallDialog"
      @closed="didInstall"
    />
    <AddExtensionRepos
      ref="addExtensionReposDialog"
      @done="updateInstallStatus(true)"
    />
  </div>
</template>

<style lang="scss" scoped>

  .setup-message {
    margin-top: 100px;
  }

  .data-loading {
    align-items: center;
    display: flex;
    justify-content: center;

    > I {
      margin-right: 5px;
    }
  }

  .plugin-reload-banner {
    align-items: center;
    background-color: var(--success-banner-bg);
    display: flex;
    padding: 0 10px;
    border-radius: 5px;
    min-height: 36px;

    > i {
      color: var(--success);
      font-size: 14px;
      font-weight: bold;
    }

    > button {
      line-height: 30px;
      min-height: 30px;
    }
  }

  .plugin-complete {
    font-size: 18px;
  }

  .plugin-list {
    display: flex;
    flex-wrap: wrap;

    > .plugin:not(:last-child) {
      margin-right: 20px;
    }

    &.v-margin {
      margin-top: 40px;
    }
  }
  .plugins {
    display: inherit;
  }

  .plugin-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .catalog-title {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    > h2 {
      flex: 1;
      margin-bottom: 0;
    }

    .link {
      cursor: pointer;
    }

    .actions-container {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
    }

    .btn.actions {
      line-height: 36px;
      min-height: 36px;
      padding: 0 10px;
    }
  }

  .plugin {
    display: flex;
    border: 1px solid var(--border);
    padding: 10px;
    width: calc(33% - 20px);
    max-width: 540px;
    margin-bottom: 20px;
    cursor: pointer;

    .plugin-icon {
      font-size: 40px;
      margin-right:10px;
      color: #888;
      width: 44px;
      height: 44px;
      display: flex;
      justify-content: center;
      align-items: center;

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
        top: 2px;
        left: 2px;
      }
    }

    .plugin-spacer {
      flex: 1;
    }

    .plugin-metadata {
      display: flex;
      flex: 1;
      flex-direction: column;

      .plugin-buttons {
        > button:not(:first-child) {
          margin-left: 5px;
        }
      }
    }

    .plugin-builtin {
      color: var(--primary);
      display: block;
      padding: 2px 0;
      text-transform: uppercase;
    }

    .plugin-name {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
      text-transform: capitalize;
    }

    .plugin-badges {
      display: flex;

      > div {
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 2px 8px;
        margin-right: 10px;
        font-size: 12px;
      }
    }

    .plugin-version {
      align-items: center;
      display: inline-flex;
      font-size: 12px;
      border-radius: 4px;
      margin: 5px 0;

      i.icon-spinner {
        padding-right: 5px;
        font-size: 16px;
        height: 16px;
        width: 16px;
      }

      .install-error {
        margin: 10px 10px 5px 0;
        font-weight: bold;
        $error-icon-size: 22px;

        > i {
          color: var(--error);
          height: $error-icon-size;
          font-size: $error-icon-size;
          width: $error-icon-size;
        }
      }
    }

    .plugin-installing {
      align-items: center;
      display: flex;

      > div {
        font-size: 14px;
        margin-left: 5px;
      }
    }

    .plugin-actions {
      align-items:center;
      display: flex;

      $error-icon-size: 22px;

      .plugin-error {
        display: inline;
        cursor: help;

        > i {
          color: var(--error);
          height: $error-icon-size;
          font-size: $error-icon-size;
          width: $error-icon-size;
        }
      }

      .btn {
        line-height: 20px;
        min-height: 20px;
        padding: 0 5px;
      }
    }
  }
  :deep() .checkbox-label {
    font-weight: normal !important;
  }

  :deep() .add-repos-banner .banner__content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  @media screen and (max-width: 1200px) {
    .plugin-list {
      .plugin {
        width: calc(50% - 20px);
      }
    }
  }

  @media screen and (max-width: 960px) {
    .plugin-list {
      .plugin {
        margin-right: 0 !important;
        width: 100%;
      }
    }
  }

</style>
