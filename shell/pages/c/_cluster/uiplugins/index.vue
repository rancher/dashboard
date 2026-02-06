<script>
import { mapGetters } from 'vuex';
import day from 'dayjs';
import { mapPref, PLUGIN_DEVELOPER } from '@shell/store/prefs';
import { sortBy } from '@shell/utils/sort';
import { allHash } from '@shell/utils/promise';
import { CATALOG, UI_PLUGIN, MANAGEMENT, ZERO_TIME } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { fetchOrCreateSetting } from '@shell/utils/settings';
import { getVersionData, isRancherPrime } from '@shell/config/version';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { NAME as APP_PRODUCT } from '@shell/config/product/apps';
import ActionMenu from '@shell/components/ActionMenuShell';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import IconMessage from '@shell/components/IconMessage.vue';
import PluginInfoPanel from './PluginInfoPanel.vue';
import SetupUIPlugins from './SetupUIPlugins.vue';
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
import { RcItemCard } from '@components/RcItemCard';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter.vue';
import versions from '@shell/utils/versions';
import { getPluginChartVersionLabel } from '@shell/utils/uiplugins';

const MAX_DESCRIPTION_LENGTH = 200;

const TABS_VALUES = {
  INSTALLED: 'installed',
  AVAILABLE: 'available',
  BUILTIN:   'builtin',
};

export default {
  components: {
    ActionMenu,
    IconMessage,
    Banner,
    PluginInfoPanel,
    Tab,
    Tabbed,
    SetupUIPlugins,
    TabTitle,
    RcItemCard,
    AppChartCardSubHeader,
    AppChartCardFooter
  },

  data() {
    return {
      TABS_VALUES,
      kubeVersion:                    null,
      activeTab:                      '',
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
      rancherVersion:                 null
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

      menuActions.push({
        action:  'manageExtensionView',
        label:   this.t('plugins.manageCatalog.label'),
        enabled: true
      });

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

      switch (this.activeTab) {
      case TABS_VALUES.INSTALLED:
        // We never show built-in extensions as installed - installed are just the ones the user has installed
        return all.filter((p) => !p.builtin && (!!p.installed || !!p.installing));
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

    // Message to display when the active tab is empty (depends on the tab)
    emptyMessage() {
      // i18n-uses plugins.empty.*
      return this.t(`plugins.empty.${ this.activeTab }`);
    },

    installed() {
      return this.available.filter((p) => !p.builtin && (!!p.installed || !!p.installing));
    },

    pluginCards() {
      return this.list.map((plugin) => ({
        id:     plugin.id,
        header: {
          title:    { text: plugin.label },
          statuses: this.getStatuses(plugin),
        },
        image: {
          src: plugin.icon || this.defaultIcon,
          alt: { text: this.t('plugins.altIcon', { extension: plugin.name }) },
        },
        content:        { text: plugin.description },
        actions:        this.getPluginActions(plugin),
        subHeaderItems: this.getSubHeaderItems(plugin),
        footerItems:    this.getFooterItems(plugin),
        plugin
      }));
    },

    available() {
      let all = this.charts.filter((c) => isUIPlugin(c));

      // Filter out hidden charts
      all = all.filter((c) => !uiPluginHasAnnotation(c, CATALOG_ANNOTATIONS.HIDDEN, 'true'));

      all = all.map((chart) => {
        // Label can be overridden by chart annotation
        const label = uiPluginAnnotation(chart, UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME) || chart.chartNameDisplay;
        const item = {
          name:        chart.chartName,
          label,
          description: chart.chartDescription,
          id:          chart.id,
          versions:    [],
          installed:   false,
          builtin:     false,
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
          item.primeOnly = latestCompatible?.annotations?.[CATALOG_ANNOTATIONS.PRIME_ONLY] === 'true';
          item.experimental = latestCompatible?.annotations?.[CATALOG_ANNOTATIONS.EXPERIMENTAL] === 'true';
          item.certified = latestCompatible?.annotations?.[CATALOG_ANNOTATIONS.CERTIFIED] === CATALOG_ANNOTATIONS._RANCHER;

          item.displayVersion = latestCompatible.version;
          item.displayVersionLabel = getPluginChartVersionLabel(latestCompatible);
          item.icon = latestCompatible.icon;
          item.created = latestCompatible.created;
        } else {
          item.primeOnly = uiPluginHasAnnotation(chart, CATALOG_ANNOTATIONS.PRIME_ONLY, 'true');
          item.experimental = uiPluginHasAnnotation(chart, CATALOG_ANNOTATIONS.EXPERIMENTAL, 'true');
          item.certified = uiPluginHasAnnotation(chart, CATALOG_ANNOTATIONS.CERTIFIED, CATALOG_ANNOTATIONS._RANCHER);

          item.displayVersion = item.versions?.[0]?.version;
          item.displayVersionLabel = getPluginChartVersionLabel(item.versions?.[0]);
          item.icon = chart.icon || latestCompatible?.annotations?.['catalog.cattle.io/ui-icon'];
          item.created = item.versions?.[0]?.created;
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
            name:                p.name,
            label,
            description:         p.metadata?.description,
            icon:                p.metadata?.icon,
            id:                  p.id,
            versions:            [],
            displayVersion:      p.metadata?.version,
            displayVersionLabel: p.metadata?.version || '-',
            installed:           true,
            installedVersion:    p.metadata?.version,
            builtin:             !!p.builtin,
            primeOnly:           rancher?.annotations?.[CATALOG_ANNOTATIONS.PRIME_ONLY] === 'true',
            experimental:        rancher?.annotations?.[CATALOG_ANNOTATIONS.EXPERIMENTAL] === 'true',
            certified:           rancher?.annotations?.[CATALOG_ANNOTATIONS.CERTIFIED] === CATALOG_ANNOTATIONS._RANCHER
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
          chart.installedVersion = p.version;

          // Can't do this here
          chart.installing = this.installing[chart.name];

          // Check for upgrade
          const latestInstallableVersion = chart.installableVersions?.[0];

          if (latestInstallableVersion && p.version !== (latestInstallableVersion.appVersion ?? latestInstallableVersion.version)) {
            // Use the currently installed version's metadata to show/hide the experimental and certified labels
            const installedVersion = (chart.installableVersions || []).find((v) => (v.appVersion ?? v.version) === p.version);

            if (installedVersion) {
              chart.primeOnly = installedVersion?.annotations?.[CATALOG_ANNOTATIONS.PRIME_ONLY] === 'true';
              chart.experimental = installedVersion?.annotations?.[CATALOG_ANNOTATIONS.EXPERIMENTAL] === 'true';
              chart.certified = installedVersion?.annotations?.[CATALOG_ANNOTATIONS.CERTIFIED] === CATALOG_ANNOTATIONS._RANCHER;
            }

            chart.upgrade = getPluginChartVersionLabel(latestInstallableVersion);
          }
        } else {
          // No chart, so add a card for the plugin based on its Custom resource being present
          const item = {
            name:                p.name,
            label:               p.name,
            description:         p.description || '-',
            id:                  `${ p.name }-${ p.version }`,
            versions:            [],
            displayVersion:      p.version,
            displayVersionLabel: p.version || '-',
            isDeveloper:         p.isDeveloper,
            installed:           true,
            installing:          false,
            builtin:             false,
            uiplugin:            p,
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
            // Can use the status directly, apart from upgrade, which maps to update
              const status = op.status.action;

              if (status === 'upgrade' && this.installing[plugin.name] === 'downgrade') {
                // Helm op is an upgrade, but we initiated a downgrade, so keep the 'downgrade' status
              } else {
                this.updatePluginInstallStatus(plugin.name, status);
              }
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
    handlePanelAction(button) {
      const { action, plugin, version } = button;

      if (action === 'uninstall') {
        this.showUninstallDialog(plugin, {});
      } else {
        this.showInstallDialog(plugin, action, {}, version);
      }
    },

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

    tabChanged(f) {
      this.activeTab = f.selectedName;
    },

    // Developer Load is in the action menu
    showDeveloperLoadDialog() {
      this.$store.dispatch('management/promptModal', {
        component:           'DeveloperLoadExtensionDialog',
        returnFocusSelector: '[data-testid="extensions-page-menu"]',
        componentProps:      {
          closed: (res) => {
            this.didInstall(res);
          }
        }
      });
    },

    showAddExtensionReposDialog() {
      this.updateAddReposSetting();
      this.refreshCharts(true);

      this.$store.dispatch('management/promptModal', {
        component:      'AddExtensionReposDialog',
        testId:         'add-extensions-repos-modal',
        componentProps: {
          done: () => {
            this.updateInstallStatus(true);
          }
        }
      });
    },

    showInstallDialog(plugin, action, ev, initialVersion = null) {
      ev?.target?.blur();
      ev?.preventDefault?.();
      ev?.stopPropagation?.();

      this.$store.dispatch('management/promptModal', {
        component:                            'InstallExtensionDialog',
        testId:                               'install-extension-modal',
        returnFocusSelector:                  `[data-testid="extension-card-${ action }-btn-${ plugin?.name }"]`,
        returnFocusFirstIterableNodeSelector: '#extensions-main-page',
        componentProps:                       {
          plugin,
          action,
          initialVersion,
          updateStatus: (pluginName, type) => {
            this.updatePluginInstallStatus(pluginName, type);
          },
          closed: (res) => {
            this.didInstall(res);
          }
        }
      });
    },

    showUninstallDialog(plugin, ev) {
      ev?.target?.blur();
      ev?.preventDefault?.();
      ev?.stopPropagation?.();

      this.$store.dispatch('management/promptModal', {
        component:                            'UninstallExtensionDialog',
        testId:                               'uninstall-extension-modal',
        returnFocusSelector:                  `[data-testid="extension-card-uninstall-btn-${ plugin.name }"]`,
        returnFocusFirstIterableNodeSelector: '#extensions-main-page',
        componentProps:                       {
          plugin,
          updateStatus: (pluginName, type) => {
            this.updatePluginInstallStatus(pluginName, type);
          },
          closed: (res) => {
            this.didUninstall(res);
          }
        }
      });
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
        // Change the activeTab to installed if we started installing a plugin
        this.$refs.tabs?.select(TABS_VALUES.INSTALLED);

        // Clear the load error, if there was one previously
        this.$store.dispatch('uiplugins/setError', { name: plugin.name, error: false });
      }
    },

    showPluginDetail(plugin) {
      const tags = this.getFooterItems(plugin);

      this.$refs.infoPanel.show({ ...plugin, tags });
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
      this.$router.push({
        name:   'c-cluster-uiplugins-catalogs',
        params: { cluster: this.$route.params.cluster }
      });
    },

    handleMenuAction(payload) {
      switch (payload?.action) {
      case 'devLoad':
        this.showDeveloperLoadDialog();
        break;
      case 'manageRepos':
        this.manageRepos();
        break;
      case 'addRancherRepos':
        this.showAddExtensionReposDialog();
        break;
      case 'manageExtensionView':
        this.manageExtensionView();
        break;
      default:
        console.warn(`Unknown menu action: ${ payload?.action }`); // eslint-disable-line no-console
      }
    },

    handlePluginCardAction(payload, card) {
      switch (payload?.action) {
      case 'uninstall':
        this.showUninstallDialog(card.plugin, payload.event);
        break;
      case 'upgrade':
        this.showInstallDialog(card.plugin, 'upgrade', payload.event);
        break;
      case 'downgrade':
        this.showInstallDialog(card.plugin, 'downgrade', payload.event);
        break;
      case 'install':
        this.showInstallDialog(card.plugin, 'install', payload.event);
        break;
      default:
        console.warn(`Unknown plugin card action: ${ payload?.action }`); // eslint-disable-line no-console
      }
    },

    updateAddReposSetting() {
      // because of https://github.com/rancher/rancher/pull/45894 we need to consider other start values
      if (this.addExtensionReposBannerSetting?.value === 'true' || this.addExtensionReposBannerSetting?.value === '' || this.addExtensionReposBannerSetting?.value === undefined) {
        this.addExtensionReposBannerSetting.value = 'false';
        this.addExtensionReposBannerSetting.save();
      }
    },

    getPluginActions(plugin) {
      const actions = [];

      if (plugin.installed) {
        const canUpdate = !!plugin.upgrade;
        const canDowngrade = plugin.installableVersions?.some((v) => isChartVersionHigher(plugin.installedVersion, v.version));
        const canUninstall = !plugin.builtin;

        if (canUpdate) {
          actions.push({
            label:  this.t('plugins.upgrade.label'),
            action: 'upgrade',
            icon:   'icon-upgrade-alt',
          });
        }

        if (canDowngrade) {
          actions.push({
            label:  this.t('plugins.downgrade.label'),
            action: 'downgrade',
            icon:   'icon-downgrade-alt',
          });
        }

        if (canUninstall) {
          if (actions.length > 0) {
            actions.push({ divider: true });
          }
          actions.push({
            label:  this.t('plugins.uninstall.label'),
            action: 'uninstall',
            icon:   'icon-delete',
          });
        }
      } else {
        if (plugin.installableVersions?.length) {
          actions.push({
            label:   this.t('plugins.install.label'),
            action:  'install',
            icon:    'icon-plus',
            enabled: true,
          });
        }
      }

      return actions;
    },

    getSubHeaderItems(plugin) {
      const items = [{
        icon:        'icon-version-alt',
        iconTooltip: { key: 'tableHeaders.version' },
        label:       plugin.displayVersionLabel,
      }];

      if (plugin.created) {
        const hasZeroTime = plugin.created === ZERO_TIME;
        const lastUpdatedItem = {
          icon:        'icon-refresh-alt',
          iconTooltip: { key: 'tableHeaders.lastUpdated' },
          label:       hasZeroTime ? this.t('generic.na') : day(plugin.created).format('MMM D, YYYY')
        };

        if (hasZeroTime) {
          lastUpdatedItem.labelTooltip = this.t('catalog.charts.appChartCard.subHeaderItem.missingVersionDate');
        }
        items.push(lastUpdatedItem);
      }

      if (plugin.installing) {
        let label;

        switch (plugin.installing) {
        case 'install':
          label = this.t('plugins.labels.installing');
          break;
        case 'uninstall':
          label = this.t('plugins.labels.uninstalling');
          break;
        case 'upgrade':
          label = this.t('plugins.labels.upgrading');
          break;
        case 'downgrade':
          label = this.t('plugins.labels.downgrading');
          break;
        default:
          label = this.t('plugins.labels.installing');
          break;
        }
        items.push({
          icon:        'icon-spinner icon-spin',
          iconTooltip: { key: 'plugins.tooltips.installing' },
          label,
        });
      }

      return items;
    },

    getFooterItems(plugin) {
      const labels = [];

      // "developer load" tag
      if (plugin.isDeveloper) {
        labels.push(this.t('plugins.labels.isDeveloper'));
      }

      if (plugin.primeOnly) {
        labels.push(this.t('plugins.labels.primeOnly'));
      }

      if (plugin.builtin) {
        labels.push(this.t('plugins.labels.builtin'));
      }

      if (!plugin.builtin && !plugin.certified && !plugin.isDeveloper) {
        labels.push(this.t('plugins.labels.third-party'));
      }

      if (!plugin.builtin && plugin.experimental) {
        labels.push(this.t('plugins.labels.experimental'));
      }

      return labels.length ? [{
        icon:        'icon-tag-alt',
        iconTooltip: { key: 'generic.tags' },
        labels,
      }] : [];
    },

    getStatuses(plugin) {
      const statuses = [];

      const errorTooltip = plugin.installedError || plugin.incompatibilityMessage || (plugin.helmError ? this.t('plugins.helmError') : null);
      const isDeprecated = plugin?.chart?.deprecated;

      if (isDeprecated || errorTooltip) {
        let tooltip;

        if (isDeprecated && errorTooltip) {
          tooltip = { text: `${ this.t('generic.deprecated') }. ${ this.t('generic.error') }: ${ errorTooltip }` };
        } else if (isDeprecated) {
          tooltip = { key: 'generic.deprecated' };
        } else { // errorTooltip is present
          tooltip = { text: `${ this.t('generic.error') }: ${ errorTooltip }` };
        }

        statuses.push({
          icon:  'icon-alert-alt',
          color: 'error',
          tooltip
        });
      }

      if (plugin.upgrade) {
        statuses.push({
          icon: 'icon-upgrade-alt', color: 'info', tooltip: { key: 'generic.upgradeable' }
        });
      }

      if (plugin.installed && !plugin.builtin && !plugin.installing) {
        statuses.push({
          icon: 'icon-confirmation-alt', color: 'success', tooltip: { text: `${ this.t('generic.installed') } (${ plugin.installedVersion })` }
        });
      }

      return statuses;
    }
  }
};
</script>

<template>
  <div id="extensions-main-page">
    <div class="plugin-header">
      <!-- normal extensions view header -->
      <h2 data-testid="extensions-page-title">
        <TabTitle breadcrumb="vendor-only">
          {{ t('plugins.title') }}
        </TabTitle>
      </h2>
      <div class="actions-container">
        <!-- extensions reload toast/notification -->
        <div
          v-if="reloadRequired"
          class="plugin-reload-banner mmr-6"
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
            button-variant="tertiary"
            :button-aria-label="t('plugins.labels.menu')"
            :custom-actions="menuActions"
            @action-invoked="handleMenuAction"
          />
        </div>
      </div>
    </div>

    <!-- extensions slide-in panel -->
    <PluginInfoPanel
      ref="infoPanel"
      @action="handlePanelAction"
    />

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
      <Banner
        v-if="!loading && showAddReposBanner"
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
        v-if="!loading"
        ref="tabs"
        :tabs-only="true"
        data-testid="extension-tabs"
        @changed="tabChanged"
      >
        <Tab
          v-if="installed.length"
          :name="TABS_VALUES.INSTALLED"
          data-testid="extension-tab-installed"
          label-key="plugins.tabs.installed"
          :badge="installed.length"
          :weight="20"
        />
        <Tab
          :name="TABS_VALUES.AVAILABLE"
          data-testid="extension-tab-available"
          label-key="plugins.tabs.available"
          :weight="19"
        />
        <Tab
          v-if="pluginDeveloper"
          :name="TABS_VALUES.BUILTIN"
          label-key="plugins.tabs.builtin"
          :weight="17"
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
        class="plugin-cards"
        :class="{'v-margin': !list.length}"
      >
        <IconMessage
          v-if="list.length === 0"
          :vertical="true"
          :subtle="true"
          icon="icon-extension"
          class="mmt-9"
          :message="emptyMessage"
        />
        <template v-else>
          <rc-item-card
            v-for="card in pluginCards"
            :id="card.id"
            :key="card.id"
            :class="{ 'single-card': pluginCards.length === 1 }"
            :header="card.header"
            :image="card.image"
            :content="card.content"
            :actions="card.actions"
            :clickable="true"
            @card-click="showPluginDetail(card.plugin)"
            @action-invoked="(payload) => handlePluginCardAction(payload, card)"
          >
            <template #item-card-sub-header>
              <AppChartCardSubHeader
                :items="card.subHeaderItems"
              />
            </template>
            <template #item-card-footer>
              <AppChartCardFooter :items="card.footerItems" />
            </template>
          </rc-item-card>
        </template>
      </div>
    </div>
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
    padding: 4px 4px 4px 12px;
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
      align-items: center;
      justify-content: flex-end;
    }

    .btn.actions {
      line-height: 36px;
      min-height: 36px;
      padding: 0 10px;
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

  .plugin-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    grid-gap: var(--gap-md);
    width: 100%;
    height: max-content;
    overflow: hidden;
    padding-bottom: 48px;

    .single-card {
      max-width: 500px;
    }
  }

</style>
