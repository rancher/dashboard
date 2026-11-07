<script>
import { mapGetters } from 'vuex';
import day from 'dayjs';
import { mapPref, PLUGIN_DEVELOPER } from '@shell/store/prefs';
import { sortBy } from '@shell/utils/sort';
import genericPluginSvg from '~shell/assets/images/generic-plugin.svg';
import { allHash } from '@shell/utils/promise';
import { CATALOG, UI_PLUGIN, MANAGEMENT } from '@shell/config/types';
import { isMissingDate } from '@shell/utils/time';
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
  UI_PLUGIN_METADATA,
  UI_PLUGIN_BUNDLE_MEMBERS_ANNOTATION,
  UI_PLUGINS_REPOS,
  EXTENSIONS_INCOMPATIBILITY_TYPES
} from '@shell/config/uiplugins';
import TabTitle from '@shell/components/TabTitle';
import { RcItemCard } from '@components/RcItemCard';
import AppChartCardSubHeader from '@shell/pages/c/_cluster/apps/charts/AppChartCardSubHeader';
import AppChartCardFooter from '@shell/pages/c/_cluster/apps/charts/AppChartCardFooter.vue';
import versions from '@shell/utils/versions';
import { compareChartVersions } from '@shell/utils/chart';
import { getPluginChartVersionLabel } from '@shell/utils/uiplugins';

const MAX_DESCRIPTION_LENGTH = 200;

const TABS_VALUES = {
  INSTALLED: 'installed',
  AVAILABLE: 'available',
  BUILTIN:   'builtin',
};

// id of the container holding the extension cards - the tabs render in `tabs-only` mode, so this is
// the tab panel they control
const EXTENSIONS_PANEL_ID = 'extensions-tab-panel';

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
      EXTENSIONS_PANEL_ID,
      kubeVersion:                    null,
      activeTab:                      '',
      activeTabButtonId:              undefined,
      installing:                     {},
      installedFromRepo:              {},
      errors:                         {},
      plugins:                        [], // The installed plugins
      // Bundle members seen during this visit to the page, as name -> bundle name.
      // Uninstalling a bundle deletes the member CRs, but the extensions stay loaded
      // in the browser until a reload, so the CRs alone stop being enough to
      // recognise them. Remembering them keeps the bundle's members from reappearing
      // as individual cards in the gap between uninstall and reload.
      seenBundleMembers:              {},
      helmOps:                        [], // Helm operations
      addExtensionReposBannerSetting: undefined,
      loading:                        true,
      menuTargetElement:              null,
      menuTargetEvent:                null,
      menuOpen:                       false,
      hasFeatureFlag:                 true,
      defaultIcon:                    genericPluginSvg,
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

    // Load apps in UI_PLUGIN_NAMESPACE to determine which repo an extension was installed from
    if (this.$store.getters['management/schemaFor'](CATALOG.APP)) {
      hash.apps = this.$store.dispatch('management/findAll', {
        type: CATALOG.APP,
        opt:  { namespaced: UI_PLUGIN_NAMESPACE }
      });
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

    // Computed to reactively update when new apps are installed
    apps() {
      return this.$store.getters['management/all'](CATALOG.APP)
        .filter((app) => app.metadata?.namespace === UI_PLUGIN_NAMESPACE);
    },

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
          alt: { text: '' },
        },
        content:        { text: plugin.description },
        actions:        this.getPluginActions(plugin),
        subHeaderItems: this.getSubHeaderItems(plugin),
        footerItems:    this.getFooterItems(plugin),
        plugin
      }));
    },

    /**
     * Names of installed extensions that belong to a bundle (umbrella chart), mapped to
     * the name of the bundle they belong to.
     *
     * Sourced from the UIPlugin CRs because the bundle marker is written into
     * spec.plugin.metadata by the umbrella chart at install time.
     */
    bundleMembership() {
      const membership = {};

      (this.plugins || []).forEach((cr) => {
        const bundleName = cr.pluginMetadata?.[UI_PLUGIN_METADATA.BUNDLE];

        if (bundleName) {
          membership[cr.name] = bundleName;
        }
      });

      return membership;
    },

    /**
     * Every extension known to belong to a bundle, including ones whose CR has just
     * been removed by an uninstall but whose code is still loaded. See
     * `seenBundleMembers`.
     */
    /**
     * Every extension currently installed, by the name it occupies in the backend
     * index - whether it got there standalone or as part of a bundle.
     */
    installedExtensionNames() {
      return new Set((this.plugins || []).map((cr) => cr.name));
    },

    bundledMemberNames() {
      return new Set([
        ...Object.keys(this.bundleMembership),
        ...Object.keys(this.seenBundleMembers),
      ]);
    },

    available() {
      let all = this.charts
        .filter((c) => isUIPlugin(c))
        .filter((c) => !uiPluginHasAnnotation(c, CATALOG_ANNOTATIONS.HIDDEN, 'true'))
        .map((chart) => this.mapChartToPluginItem(chart))
        .filter((c) => c.versions.length > 0);

      // Extensions installed as part of a bundle are represented by the bundle's own
      // card, so they must not get one of their own. The marker lives on the CR's
      // spec.plugin.metadata, which is why this is sourced from this.plugins rather than
      // read off the loaded plugin - this.uiplugins entries carry the extension's own
      // package.json, not CR data.
      const bundledMemberNames = this.bundledMemberNames;

      this.uiplugins.forEach((p) => {
        if (bundledMemberNames.has(p.name)) {
          return;
        }

        if (!all.find((c) => c.name === p.name)) {
          const item = this.buildLoadedPluginItem(p);

          if (item) {
            all.push(item);
          }
        }
      });

      this.plugins.forEach((p) => this.wirePluginCRToChart(p, all));

      this.mergePluginErrors(all);

      // Remove duplicate installed plugins - keep only ones with uiplugin (correct CR data)
      const installedByName = {};

      all.forEach((plugin) => {
        if (plugin.description && plugin.description.length > MAX_DESCRIPTION_LENGTH) {
          plugin.description = `${ plugin.description.substr(0, MAX_DESCRIPTION_LENGTH) } ...`;
        }

        if (plugin.installed) {
          const existing = installedByName[plugin.name];

          if (!existing || plugin.uiplugin) {
            installedByName[plugin.name] = plugin;
          }
        }
      });

      all = all.filter((plugin) => {
        if (!plugin.installed) {
          return true;
        }

        return installedByName[plugin.name] === plugin;
      });

      // Resolved last, because the message names the other card the admin has to deal
      // with and that card's title is only known once the whole list exists. Stored on
      // the item so the card's tooltip and the info panel's banner read the same answer.
      all.forEach((plugin) => {
        plugin.installConflictMessage = this.installConflictMessage(this.installConflict(plugin), all);
      });

      return sortBy(all, 'name', false);
    }
  },

  watch: {
    // Accumulate bundle membership rather than tracking it, so a member stays
    // recognised after its CR is deleted. Only grows while the page is open; a
    // reload - which uninstalling asks for anyway - starts it empty again.
    bundleMembership: {
      handler(neu) {
        Object.keys(neu || {}).forEach((name) => {
          this.seenBundleMembers[name] = neu[name];
        });
      },
      immediate: true,
      deep:      true
    },

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
            const allWithSameName = this.available.filter((p) => p.name === plugin.name);
            let targetPluginId;

            // When multiple plugins share the same name (from different repositories),
            // a single helm operation will trigger updates. We need to correctly identify
            // the specific plugin that is either currently being installed/updated or is already installed
            // so we don't accidentally mark all identically named plugins as "installing".
            const installingPlugin = allWithSameName.find((p) => this.installing[p.id]);
            const installedPlugin = allWithSameName.find((p) => p.installed);

            if (installingPlugin) {
              targetPluginId = installingPlugin.id;
            } else if (installedPlugin) {
              targetPluginId = installedPlugin.id;
            } else {
              targetPluginId = allWithSameName[0]?.id;
            }

            if (plugin.id !== targetPluginId) {
              return;
            }

            const active = op.metadata.state?.transitioning;
            const error = op.metadata.state?.error;

            this.errors[plugin.id] = error;

            if (active) {
            // Can use the status directly, apart from upgrade, which maps to update
              const status = op.status.action;

              if (status === 'upgrade' && this.installing[plugin.id] === 'downgrade') {
                // Helm op is an upgrade, but we initiated a downgrade, so keep the 'downgrade' status
              } else {
                this.updatePluginInstallStatus(plugin.id, status);
              }
            } else if (op.status.action === 'uninstall') {
            // Uninstall has finished
              this.updatePluginInstallStatus(plugin.id, false);
            } else if (error) {
              this.updatePluginInstallStatus(plugin.id, false);
            }
          } else {
            this.updatePluginInstallStatus(plugin.id, false);
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

            // A bundle's CRs are named after its members, so matching on the CR name
            // alone never clears the bundle's own card and it spins until a reload
            const bundleName = this.bundleMembership[plugin.name] || this.seenBundleMembers[plugin.name];

            (this.available || []).forEach((c) => {
              if (c.name === plugin.name || (bundleName && c.name === bundleName)) {
                this.updatePluginInstallStatus(c.id, false);
              }
            });
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
      this.activeTabButtonId = f.tabButtonId;
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

      // Check if a plugin with the same name is already installed from a different repo
      if (action === 'install') {
        const installedPlugin = this.available.find((p) => p.name === plugin.name && p.installed);
        const isInstalledFromDifferentSource = !!installedPlugin && installedPlugin.id !== plugin.id;

        if (isInstalledFromDifferentSource) {
          // Show a different dialog that prompts the user to uninstall the existing version first
          this.$store.dispatch('management/promptModal', {
            component:                            'UninstallExistingExtensionDialog',
            testId:                               'uninstall-existing-extension-modal',
            returnFocusSelector:                  `[data-testid="extension-card-${ action }-btn-${ plugin?.name }"]`,
            returnFocusFirstIterableNodeSelector: '#extensions-main-page',
            componentProps:                       {
              installedPlugin,
              updateStatus: (pluginId, type) => {
                this.updatePluginInstallStatus(pluginId, type);
              },
              closed: (res) => {
                if (res?.uninstalled) {
                  this.didUninstall(res.plugin);
                }
              }
            }
          });

          return;
        }
      }

      this.$store.dispatch('management/promptModal', {
        component:                            'InstallExtensionDialog',
        testId:                               'install-extension-modal',
        returnFocusSelector:                  `[data-testid="extension-card-${ action }-btn-${ plugin?.name }"]`,
        returnFocusFirstIterableNodeSelector: '#extensions-main-page',
        componentProps:                       {
          plugin,
          action,
          initialVersion,
          updateStatus: (pluginId, type) => {
            this.updatePluginInstallStatus(pluginId, type);
          },
          closed: (res) => {
            if (res && plugin?.chart?.repoName) {
              this.installedFromRepo[plugin.name] = plugin.chart.repoName;
            }
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
          updateStatus: (pluginId, type) => {
            this.updatePluginInstallStatus(pluginId, type);
          },
          closed: (res) => {
            this.didUninstall(res);
          }
        }
      });
    },

    didUninstall(plugin) {
      if (plugin) {
        this.updatePluginInstallStatus(plugin.id, 'uninstall');

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

    updatePluginInstallStatus(id, status) {
      this.installing[id] = status;
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

    /**
     * Why this extension cannot be installed or upgraded right now, or null.
     *
     * An extension can only exist once on a cluster: the backend index is keyed by
     * plugin name, and the loader resolves `window[<name>-<version>]`. So a bundle and
     * a standalone copy of one of its members cannot both be installed - Helm would
     * reject the second with an ownership error on the shared UIPlugin. Catch it here
     * instead, while it can still be explained.
     *
     * Bundles are checked whether installed or not: a later bundle version can add a
     * member the admin already runs standalone, and that upgrade fails the same way.
     */
    installConflict(plugin) {
      if (plugin.builtin) {
        return null;
      }

      // A bundle, installed or not, against the members it would bring in. Members this
      // same bundle already owns are not a conflict - that is just the bundle being
      // installed, or a second catalog copy of a bundle that is already installed.
      if (plugin.bundleMemberNames?.length) {
        const conflicting = plugin.bundleMemberNames.filter((name) => {
          return this.installedExtensionNames.has(name) && this.bundleMembership[name] !== plugin.name;
        });

        if (conflicting.length) {
          return { type: 'bundle', names: conflicting };
        }

        return null;
      }

      if (plugin.installed) {
        return null;
      }

      // Installing an extension an installed bundle already provides
      const owningBundle = this.bundleMembership[plugin.name];

      if (owningBundle) {
        return { type: 'member', names: [owningBundle] };
      }

      return null;
    },

    /**
     * The card title an admin sees for a chart name, so a conflict message names the
     * card they have to act on rather than its chart id. Whatever a conflict names is
     * installed, and installed things always have a card, so the fallback is only a
     * guard against the list changing under us.
     */
    pluginLabelForName(name, all) {
      return (all || []).find((c) => c.name === name)?.label || name;
    },

    installConflictMessage(conflict, all) {
      if (!conflict) {
        return '';
      }

      const names = conflict.names.map((name) => this.pluginLabelForName(name, all)).join(', ');

      return conflict.type === 'bundle' ? this.t('plugins.conflict.bundleBlocked', { names }, true) : this.t('plugins.conflict.memberBlocked', { name: names }, true);
    },

    getPluginActions(plugin) {
      const actions = [];
      const conflict = this.installConflict(plugin);

      if (plugin.installed) {
        // A bundle whose next version would collide with a standalone extension cannot
        // be upgraded into - Helm rejects it - so offer uninstall but not the upgrade
        const canUpdate = !!plugin.upgrade && !conflict;
        const canDowngrade = plugin.installableVersions?.some((v) => compareChartVersions(plugin.installedVersion, v.version) > 0);
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
      } else if (plugin.installableVersions?.length && !conflict) {
        actions.push({
          label:   this.t('plugins.install.label'),
          action:  'install',
          icon:    'icon-plus',
          enabled: true,
        });
      }

      return actions;
    },

    getSubHeaderItems(plugin) {
      const items = [{
        icon:        'icon-version-alt',
        iconTooltip: { key: 'tableHeaders.version' },
        label:       plugin.displayVersionLabel,
      }];

      if (!isMissingDate(plugin.created)) {
        items.push({
          icon:        'icon-refresh-alt',
          iconTooltip: { key: 'tableHeaders.lastUpdated' },
          label:       day(plugin.created).format('MMM D, YYYY')
        });
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
      const footerItems = [];
      const repoNameToDisplay = plugin?.chart?.repoNameDisplay || plugin?.originalRepoNameDisplay;

      if (repoNameToDisplay) {
        footerItems.push({
          icon:        'repository-alt',
          iconTooltip: { key: 'tableHeaders.repoName' },
          labels:      [repoNameToDisplay]
        });
      }

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

      if (labels.length) {
        footerItems.push({
          icon:        'tag-alt',
          iconTooltip: { key: 'generic.tags' },
          labels,
        });
      }

      return footerItems;
    },

    getStatuses(plugin) {
      const statuses = [];

      const errorMsg = plugin.installedError || (plugin.helmError ? this.t('plugins.helmError') : null);
      const incompatibilityMsg = plugin.incompatibilityMessage;
      const isDeprecated = uiPluginHasAnnotation(plugin?.chart, CATALOG_ANNOTATIONS.DEPRECATED, 'true');

      const tooltipMsgs = [];

      if (isDeprecated) {
        tooltipMsgs.push(this.t('generic.deprecated'));
      }

      if (errorMsg) {
        tooltipMsgs.push(errorMsg);
      } else if (incompatibilityMsg) {
        tooltipMsgs.push(incompatibilityMsg);
      }

      if (plugin.installConflictMessage) {
        tooltipMsgs.push(plugin.installConflictMessage);
      }

      if (tooltipMsgs.length) {
        statuses.push({
          icon:    'icon-alert-alt',
          color:   'error',
          tooltip: { text: tooltipMsgs.join('<br/>') }
        });
      }

      if (plugin.upgrade) {
        statuses.push({
          icon: 'icon-upgrade-alt', color: 'info', tooltip: { text: this.t('plugins.upgradeableTo', { version: plugin.upgrade }) }
        });
      }

      if (plugin.installed && !plugin.builtin && !plugin.installing) {
        statuses.push({
          icon: 'icon-confirmation-alt', color: 'success', tooltip: { text: `${ this.t('generic.installed') } (${ plugin.displayVersionLabel })` }
        });
      }

      return statuses;
    },

    extractCertificationFlags(annotations) {
      return {
        primeOnly:    annotations?.[CATALOG_ANNOTATIONS.PRIME_ONLY] === 'true',
        experimental: annotations?.[CATALOG_ANNOTATIONS.EXPERIMENTAL] === 'true',
        certified:    annotations?.[CATALOG_ANNOTATIONS.CERTIFIED] === CATALOG_ANNOTATIONS._RANCHER,
      };
    },

    buildIncompatibilityMessage(versionData) {
      const { versionIncompatibilityData, version } = versionData;
      const params = {
        version,
        required: versionIncompatibilityData?.required,
      };

      if (versionIncompatibilityData?.type === EXTENSIONS_INCOMPATIBILITY_TYPES.HOST) {
        params.mainHost = versionIncompatibilityData?.mainHost;
      }

      return this.t(versionIncompatibilityData?.cardMessageKey, params, true);
    },

    mapChartToPluginItem(chart) {
      const label = uiPluginAnnotation(chart, UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME) || chart.chartNameDisplay;
      const item = {
        name:                   chart.chartName,
        label,
        description:            chart.chartDescription,
        id:                     chart.id,
        versions:               [...chart.versions],
        installed:              false,
        builtin:                false,
        chart,
        incompatibilityMessage: '',
        // Members of a bundle, from the chart annotation rather than from any CR, so
        // a conflict can be spotted before the bundle is installed. Empty for a
        // regular extension.
        bundleMemberNames:      (uiPluginAnnotation(chart, UI_PLUGIN_BUNDLE_MEMBERS_ANNOTATION) || '')
          .split(',')
          .map((n) => n.trim())
          .filter((n) => !!n),
      };

      item.installableVersions = item.versions.filter((version) => isSupportedChartVersion({
        version, rancherVersion: this.rancherVersion, kubeVersion: this.kubeVersion
      }));

      item.versions = item.versions.map((version) => isSupportedChartVersion({
        version, rancherVersion: this.rancherVersion, kubeVersion: this.kubeVersion
      }, true));

      const latestCompatible = item.installableVersions?.[0];
      const latestNotCompatible = item.versions.find((version) => !version.isVersionCompatible);

      if (latestCompatible) {
        Object.assign(item, {
          ...this.extractCertificationFlags(latestCompatible?.annotations),
          displayVersion:      latestCompatible.version,
          displayVersionLabel: getPluginChartVersionLabel(latestCompatible),
          icon:                latestCompatible.icon,
          created:             latestCompatible.created,
        });
      } else {
        Object.assign(item, {
          primeOnly:           uiPluginHasAnnotation(chart, CATALOG_ANNOTATIONS.PRIME_ONLY, 'true'),
          experimental:        uiPluginHasAnnotation(chart, CATALOG_ANNOTATIONS.EXPERIMENTAL, 'true'),
          certified:           uiPluginHasAnnotation(chart, CATALOG_ANNOTATIONS.CERTIFIED, CATALOG_ANNOTATIONS._RANCHER),
          displayVersion:      item.versions?.[0]?.version,
          displayVersionLabel: getPluginChartVersionLabel(item.versions?.[0]),
          icon:                chart.icon || latestCompatible?.annotations?.['catalog.cattle.io/ui-icon'],
          created:             item.versions?.[0]?.created,
        });
      }

      if (latestNotCompatible && item.installableVersions.length && isChartVersionHigher(latestNotCompatible.version, item.installableVersions?.[0].version)) {
        item.incompatibilityMessage = this.buildIncompatibilityMessage(latestNotCompatible);
      }

      if (this.installing[item.id]) {
        item.installing = this.installing[item.id];
      }

      return item;
    },

    buildLoadedPluginItem(plugin) {
      const rancher = typeof plugin.metadata?.rancher === 'object' ? plugin.metadata.rancher : {};
      const label = rancher.annotations?.[UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME] || plugin.name;

      if (plugin.builtin && rancher[UI_PLUGIN_CHART_ANNOTATIONS.HIDDEN_BUILTIN]) {
        return null;
      }

      return {
        name:                plugin.name,
        label,
        description:         plugin.metadata?.description,
        icon:                plugin.metadata?.icon,
        id:                  plugin.id,
        versions:            [],
        displayVersion:      plugin.metadata?.version,
        displayVersionLabel: plugin.metadata?.version || '-',
        installed:           true,
        installedVersion:    plugin.metadata?.version,
        builtin:             !!plugin.builtin,
        ...this.extractCertificationFlags(rancher?.annotations),
      };
    },

    /**
     * Wire a member of a bundle onto the bundle's own card.
     *
     * A bundle is a single Helm release whose subcharts each create their own UIPlugin
     * CR, so the CR name never matches the chart name and the standard lookup below
     * would spawn one orphan card per member. Resolve against the bundle instead, and
     * never push more than one card - the bundle has exactly one by definition.
     */
    wireBundledPluginCRToChart(pluginCR, bundleName, all) {
      const app = this.apps.find((a) => a.metadata.name === bundleName && a.metadata.namespace === UI_PLUGIN_NAMESPACE);
      const originalRepoName = app?.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME] || app?.metadata?.labels?.[CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME];

      let chart;

      // Two repos can offer the same bundle - a repository's own gh-pages and
      // ui-plugin-charts both carry it - so mark the copy it was actually installed
      // from, otherwise Upgrade on the wrong card pulls from the wrong repo
      if (originalRepoName) {
        chart = all.find((c) => c.name === bundleName && c.chart?.repoName === originalRepoName);
      }

      if (!chart) {
        chart = all.find((c) => c.name === bundleName);
      }

      if (!chart) {
        // The bundle's chart isn't in the catalog - the repo was removed, or it was
        // installed from somewhere we can't see. Fall back to the Helm release so the
        // bundle can still be uninstalled, as a standalone extension does below.
        return this.pushBundleFallbackCard(pluginCR, bundleName, app, all);
      }

      chart.installed = true;
      chart.isBundle = true;
      chart.uiplugin = chart.uiplugin || pluginCR;

      // available() is a computed rebuilt from scratch, so this accumulates cleanly
      // across the one call made per member CR.
      chart.bundleMembers = [...(chart.bundleMembers || []), pluginCR];
      chart.installing = this.installing[chart.id];

      // A bundle's version is the umbrella chart's version, never a member's
      const appChartVersion = app?.spec?.chart?.metadata?.version;
      const installedVersion = chart.versions?.find((v) => v.version === appChartVersion);

      chart.installedVersion = installedVersion?.version ?? appChartVersion ?? chart.installedVersion;
      chart.displayVersion = chart.installedVersion;
      chart.displayVersionLabel = installedVersion ? getPluginChartVersionLabel(installedVersion) : chart.installedVersion;

      if (installedVersion) {
        chart.created = installedVersion.created;
        chart.icon = installedVersion.icon || chart.icon;

        Object.assign(chart, this.extractCertificationFlags(installedVersion.annotations));
      }

      const latestInstallableVersion = chart.installableVersions?.[0];

      if (latestInstallableVersion && chart.installedVersion &&
          compareChartVersions(latestInstallableVersion.version, chart.installedVersion) > 0) {
        chart.upgrade = getPluginChartVersionLabel(latestInstallableVersion);
      }
    },

    /**
     * A card for an installed bundle whose chart is no longer in the catalog, built
     * from the Helm release the way the standalone fallback is. Without it the bundle
     * vanishes from the page while its extensions stay loaded, leaving no way to
     * uninstall it. Only the first member reaches here - the card it pushes is what
     * the lookup above finds for the rest, so they wire onto it normally.
     */
    pushBundleFallbackCard(pluginCR, bundleName, app, all) {
      // Nothing to describe the bundle with, and a card per member is what this whole
      // path exists to avoid, so leave it out rather than guess
      if (!app) {
        return;
      }

      const appChartMeta = app.spec?.chart?.metadata;
      const appAnnotations = appChartMeta?.annotations || {};
      const originalRepoName = appAnnotations[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME] || app.metadata?.labels?.[CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME];
      const version = appChartMeta?.version;
      let originalRepoDisplayName = null;

      if (originalRepoName) {
        originalRepoDisplayName = this.$store.getters['i18n/withFallback'](`catalog.repo.name."${ originalRepoName }"`, null, originalRepoName);
      }

      all.push({
        name:                    bundleName,
        label:                   appAnnotations[UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME] || appChartMeta?.name || bundleName,
        description:             appChartMeta?.description || '-',
        icon:                    appChartMeta?.icon || appAnnotations['catalog.cattle.io/ui-icon'],
        id:                      `${ bundleName }-${ version }`,
        versions:                [],
        displayVersion:          version,
        displayVersionLabel:     version || '-',
        isDeveloper:             false,
        installed:               true,
        isBundle:                true,
        bundleMembers:           [pluginCR],
        installedVersion:        version,
        installing:              false,
        builtin:                 false,
        uiplugin:                pluginCR,
        originalRepoNameDisplay: originalRepoDisplayName,
        ...this.extractCertificationFlags(appAnnotations),
      });
    },

    wirePluginCRToChart(pluginCR, all) {
      const bundleName = this.bundleMembership[pluginCR.name];

      if (bundleName) {
        return this.wireBundledPluginCRToChart(pluginCR, bundleName, all);
      }

      const app = this.apps.find((a) => a.metadata.name === pluginCR.name && a.metadata.namespace === UI_PLUGIN_NAMESPACE);
      const originalRepoName = app?.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.SOURCE_REPO_NAME] || app?.metadata?.labels?.[CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME];

      let chart;

      if (originalRepoName) {
        chart = all.find((c) => c.name === pluginCR.name && c.chart?.repoName === originalRepoName);
      }

      // fallback to try and prevent https://github.com/rancher/dashboard/issues/17956
      // which we believe is due to a race condition
      // we fall back to plugin name which should be present when going through the "installed plugins" (uiplugins) and should be enough to find the correct chart in the majority of cases, as long as there are not multiple charts with the same name across different repos
      if (!chart) {
        const fallbackRepoName = this.installedFromRepo?.[pluginCR.name];

        if (fallbackRepoName) {
          chart = all.find((c) => c.name === pluginCR.name && c.chart?.repoName === fallbackRepoName);
        }
      }

      if (chart) {
        chart.installed = true;
        chart.uiplugin = pluginCR;
        chart.installing = this.installing[chart.id];

        // the UIPlugin CR reports the app version, while every version field here is a chart
        // version. The installed app knows which chart version is actually running, so prefer that
        // and only fall back to matching on app version when there is no app to read it from
        const appChartVersion = app?.spec?.chart?.metadata?.version;
        const installedVersion = chart.versions?.find((v) => v.version === appChartVersion) ||
          chart.versions?.find((v) => (v.appVersion ?? v.version) === pluginCR.version);

        chart.installedVersion = installedVersion?.version ?? appChartVersion ?? pluginCR.version;

        // an installed extension is described by the version it is running, not the latest on offer
        chart.displayVersion = chart.installedVersion;
        chart.displayVersionLabel = installedVersion ? getPluginChartVersionLabel(installedVersion) : chart.installedVersion;

        if (installedVersion) {
          chart.created = installedVersion.created;
          chart.icon = installedVersion.icon || chart.icon;

          Object.assign(chart, this.extractCertificationFlags(installedVersion.annotations));
        }

        const latestInstallableVersion = chart.installableVersions?.[0];

        if (latestInstallableVersion && compareChartVersions(latestInstallableVersion.version, chart.installedVersion) > 0) {
          chart.upgrade = getPluginChartVersionLabel(latestInstallableVersion);
        }
      } else {
        const appChartMeta = app?.spec?.chart?.metadata;
        const appAnnotations = appChartMeta?.annotations || {};
        let originalRepoDisplayName = null;

        if (originalRepoName) {
          originalRepoDisplayName = this.$store.getters['i18n/withFallback'](`catalog.repo.name."${ originalRepoName }"`, null, originalRepoName);
        }

        all.push({
          name:                    pluginCR.name,
          label:                   appAnnotations[UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME] || appChartMeta?.name || pluginCR.name,
          description:             appChartMeta?.description || pluginCR.description || '-',
          icon:                    appChartMeta?.icon || appAnnotations['catalog.cattle.io/ui-icon'],
          id:                      `${ pluginCR.name }-${ pluginCR.version }`,
          versions:                [],
          displayVersion:          pluginCR.version,
          displayVersionLabel:     pluginCR.version || '-',
          isDeveloper:             pluginCR.isDeveloper,
          installed:               true,
          installedVersion:        pluginCR.version,
          installing:              false,
          builtin:                 false,
          uiplugin:                pluginCR,
          originalRepoNameDisplay: originalRepoDisplayName,
          ...this.extractCertificationFlags(appAnnotations),
        });
      }
    },

    mergePluginErrors(all) {
      // A bundle member has no card of its own, so its load error has to land on the
      // bundle's card - otherwise a broken member leaves no sign on the page at all.
      // Several members can fail against the same card, so collect before assigning
      // and name the member, since the card's own title says nothing about which broke.
      const errorsByCard = {};

      Object.keys(this.uiErrors).forEach((errorName) => {
        const cardName = this.bundleMembership[errorName] || this.seenBundleMembers[errorName] || errorName;
        const error = this.uiErrors[errorName];
        const message = (error && typeof error === 'string') ? this.t(error, null, true) : '';

        errorsByCard[cardName] = errorsByCard[cardName] || [];

        if (message) {
          errorsByCard[cardName].push(cardName === errorName ? message : `${ errorName }: ${ message }`);
        }
      });

      Object.keys(errorsByCard).forEach((cardName) => {
        const chart = all.find((c) => c.name === cardName);

        if (chart) {
          chart.installedError = errorsByCard[cardName].join(' ');
        }
      });

      Object.keys(this.errors).forEach((errorId) => {
        const chart = all.find((c) => c.id === errorId);

        if (chart) {
          chart.helmError = !!this.errors[errorId];
        }
      });
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
        role="status"
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
        :external-panel-id="EXTENSIONS_PANEL_ID"
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
      <!--
        The tabs above are `tabs-only`, so this is the panel they control. It has to be associated
        with them explicitly, otherwise the tab structure isn't programmatically complete.
      -->
      <div
        v-else
        :id="EXTENSIONS_PANEL_ID"
        class="plugin-cards"
        :class="{'v-margin': !list.length}"
        role="tabpanel"
        :aria-labelledby="activeTabButtonId || undefined"
        tabindex="0"
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
