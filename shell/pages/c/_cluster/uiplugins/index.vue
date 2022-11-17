<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';
import { mapPref, PLUGIN_DEVELOPER } from '@shell/store/prefs';
import { sortBy } from '@shell/utils/sort';
import { allHash } from '@shell/utils/promise';
import { CATALOG, UI_PLUGIN, SERVICE } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { NAME as APP_PRODUCT } from '@shell/config/product/apps';
import ActionMenu from '@shell/components/ActionMenu';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import IconMessage from '@shell/components/IconMessage.vue';
import LazyImage from '@shell/components/LazyImage';
import UninstallDialog from './UninstallDialog.vue';
import InstallDialog from './InstallDialog.vue';
import DeveloperInstallDialog from './DeveloperInstallDialog.vue';
import PluginInfoPanel from './PluginInfoPanel.vue';
import SetupUIPlugins from './SetupUIPlugins';
import RemoveUIPlugins from './RemoveUIPlugins';
import {
  isUIPlugin,
  uiPluginAnnotation,
  uiPluginHasAnnotation,
  isSupportedChartVersion,
  UI_PLUGIN_NAMESPACE,
  UI_PLUGIN_CHART_ANNOTATIONS
} from '@shell/config/uiplugins';

const MAX_DESCRIPTION_LENGTH = 200;

export default {
  components: {
    ActionMenu,
    DeveloperInstallDialog,
    IconMessage,
    InstallDialog,
    LazyImage,
    PluginInfoPanel,
    Tab,
    Tabbed,
    UninstallDialog,
    SetupUIPlugins,
    RemoveUIPlugins,
  },

  data() {
    return {
      view:              '',
      charts:            [],
      installing:        {},
      errors:            {},
      plugins:           [], // The installed plugins
      helmOps:           [], // Helm operations
      loading:           true,
      menuTargetElement: null,
      menuTargetEvent:   null,
      menuOpen:          false,
      hasService:        false,
      defaultIcon:       require('~shell/assets/images/generic-plugin.svg'),
      reloadRequired:    false,
    };
  },

  layout: 'plain',

  async fetch() {
    const hash = {};

    const isSetup = await this.updateInstallStatus();

    if (isSetup) {
      if (this.$store.getters['management/schemaFor'](UI_PLUGIN)) {
        hash.plugins = this.$store.dispatch('management/findAll', { type: UI_PLUGIN });
      }
    }

    hash.load = await this.$store.dispatch('catalog/load');

    if (this.$store.getters['management/schemaFor'](CATALOG.OPERATION)) {
      hash.helmOps = await this.$store.dispatch('management/findAll', { type: CATALOG.OPERATION });
    }

    const res = await allHash(hash);

    this.plugins = res.plugins || [];
    this.helmOps = res.helmOps || [];

    const c = this.$store.getters['catalog/rawCharts'];

    this.charts = Object.values(c);

    // If there are no plugins installed, default to the catalog view
    if (this.plugins.length === 0) {
      this.$refs.tabs?.select('available');
    }

    this.loading = false;
  },

  computed: {
    pluginDeveloper: mapPref(PLUGIN_DEVELOPER),

    ...mapGetters({ uiplugins: 'uiplugins/plugins' }),
    ...mapGetters({ uiErrors: 'uiplugins/errors' }),

    menuActions() {
      const menuActions = [];

      // Add link to go to the Repos view of the local cluster
      menuActions.push({
        action:  'manageRepos',
        label:   this.t('plugins.manageRepos'),
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

      if (this.hasService) {
        menuActions.push( { divider: true });
        menuActions.push({
          action:  'removePluginSupport',
          label:   this.t('plugins.setup.remove.label'),
          enabled: true
        });
      }

      return menuActions;
    },

    list() {
      const all = this.available;

      switch (this.view) {
      case 'installed':
        return all.filter(p => !!p.installed || !!p.installing);
      case 'updates':
        return this.updates;
      case 'available':
        return all.filter(p => !p.installed);
      default:
        return all;
      }
    },

    hasMenuActions() {
      return this.menuActions?.length > 0;
    },

    // Message to display when the tab view is empty (depends on the tab)
    emptyMessage() {
      return this.t(`plugins.empty.${ this.view }`);
    },

    updates() {
      return this.available.filter(plugin => !!plugin.upgrade);
    },

    available() {
      let all = this.charts.filter(c => isUIPlugin(c));

      // Filter out hidden charts
      all = all.filter(c => !uiPluginHasAnnotation(c, CATALOG_ANNOTATIONS.HIDDEN, 'true'));

      all = all.map((chart) => {
        // Label can be overridden by chart annotation
        const label = uiPluginAnnotation(UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME) || chart.chartNameDisplay;
        const item = {
          name:           chart.chartNameDisplay,
          label,
          description:    chart.chartDescription,
          id:             chart.id,
          versions:       [],
          displayVersion: chart.versions?.length > 0 ? chart.versions[0].version : '',
          installed:      false,
          builtin:        false,
          experimental:   uiPluginHasAnnotation(chart, CATALOG_ANNOTATIONS.EXPERIMENTAL, 'true'),
          certified:      uiPluginHasAnnotation(chart, CATALOG_ANNOTATIONS.CERTIFIED, CATALOG_ANNOTATIONS._RANCHER),
        };

        this.latest = chart.versions[0];
        item.versions = [...chart.versions];
        item.chart = chart;

        // Filter the versions, leaving only those that are compatible with this Rancher
        item.versions = item.versions.filter(version => isSupportedChartVersion(version));

        if (this.latest) {
          item.icon = chart.icon || this.latest.annotations['catalog.cattle.io/ui-icon'];
        }

        if (this.installing[item.name]) {
          item.installing = this.installing[item.name];
        }

        return item;
      });

      // Remove charts with no installable versions
      all = all.filter(c => c.versions.length > 0);

      // Check that all of the loaded plugins are represented
      this.uiplugins.forEach((p) => {
        const chart = all.find(c => c.name === p.name);

        if (!chart) {
          // A pluign is loaded, but there is no chart, so add an item so that it shows up
          const item = {
            name:           p.name,
            label:          p.name,
            description:    p.metadata?.description,
            icon:           p.metadata?.icon,
            id:             p.id,
            versions:       [],
            displayVersion: p.metadata?.version || '-',
            installed:      true,
            builtin:        !!p.builtin,
          };

          all.push(item);
        }
      });

      // Go through the CRs for the plugins and wire them into the catalog
      this.plugins.forEach((p) => {
        const chart = all.find(c => c.name === p.name);

        if (chart) {
          chart.installed = true;
          chart.uiplugin = p;
          chart.displayVersion = p.version;

          // Can't do this here
          chart.installing = this.installing[chart.name];

          // Check for upgrade
          if (chart.versions.length && p.version !== chart.versions[0].version) {
            chart.upgrade = chart.versions[0].version;
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
        const chart = all.find(c => c.name === e);

        if (chart) {
          const error = this.uiErrors[e];

          if (error && typeof error === 'string') {
            chart.error = this.t(this.uiErrors[e]);
          } else {
            chart.error = false;
          }
        }
      });

      // Merge in the plugin load errors from help ops
      Object.keys(this.errors).forEach((e) => {
        const chart = all.find(c => c.name === e);

        if (chart) {
          chart.helmError = !!this.errors[e];
        }
      });

      // Clamp the lengths of the descriptions
      all.forEach((plugin) => {
        if (plugin.description && plugin.description.length > MAX_DESCRIPTION_LENGTH) {
          plugin.description = `${ plugin.description.substr(0, MAX_DESCRIPTION_LENGTH) } ...`;
        }
      });

      // Sort by name
      return sortBy(all, 'name', false);
    },
  },

  watch: {
    helmOps(neu) {
      // Get Helm operations for UI plugins and order by date
      let pluginOps = neu.filter((op) => {
        return op.namespace === UI_PLUGIN_NAMESPACE;
      });

      pluginOps = sortBy(pluginOps, 'metadata.creationTimestamp', true);

      // Go through the installed plugins
      (this.available || []).forEach((plugin) => {
        const op = pluginOps.find(o => o.status?.releaseName === plugin.name);

        if (op) {
          const active = op.metadata.state?.transitioning;
          const error = op.metadata.state?.error;

          Vue.set(this.errors, plugin.name, error);

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

    plugins(neu, old) {
      const installed = this.$store.getters['uiplugins/plugins'];
      const shouldHaveLoaded = (installed || []).filter(p => !this.uiErrors[p.name] && !p.builtin);
      let changes = 0;

      // Did the user remove an extension
      if (neu?.length < shouldHaveLoaded.length) {
        changes++;
      }

      neu.forEach((plugin) => {
        const existing = installed.find(p => !p.removed && p.name === plugin.name && p.version === plugin.version);

        if (!existing && plugin.isCached) {
          if (!this.uiErrors[plugin.name]) {
            changes++;
          }

          this.updatePluginInstallStatus(plugin.name, false);
        }
      });

      if (changes > 0 ) {
        Vue.set(this, 'reloadRequired', true);
      }
    },
  },

  // Forget the types when we leave the page
  beforeDestroy() {
    this.$store.dispatch('management/forgetType', UI_PLUGIN);
    this.$store.dispatch('management/forgetType', CATALOG.OPERATION);
    this.$store.dispatch('management/forgetType', CATALOG.APP);
    this.$store.dispatch('management/forgetType', CATALOG.CLUSTER_REPO);
  },

  methods: {
    async updateInstallStatus() {
      let hasService;

      try {
        const service = await this.$store.dispatch('management/find', {
          type: SERVICE,
          id:   `${ UI_PLUGIN_NAMESPACE }/ui-plugin-operator`,
          opt:  { force: true },
        });

        hasService = !!service;
      } catch (e) {
        hasService = false;
      }

      Vue.set(this, 'hasService', hasService);

      return hasService;
    },

    filterChanged(f) {
      this.view = f.selectedName;
    },

    removePluginSupport() {
      this.$refs.removeUIPlugins.showDialog();
    },

    // Developer Load is in the action menu
    showDeveloperLoaddDialog() {
      this.$refs.developerInstallDialog.showDialog();
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

        // Clear the load error, if there was one
        this.$store.dispatch('uiplugins/setError', { name: plugin.name, error: false });
      }
    },

    didInstall(plugin) {
      if (plugin) {
        // Change the view to installed if we started installing a plugin
        this.$refs.tabs?.select('installed');

        // Clear the load error, if there was one previously
        this.$store.dispatch('uiplugins/setError', { name: plugin.name, error: false });
      }
    },

    showPluginDetail(plugin) {
      this.$refs.infoPanel.show(plugin);
    },

    updatePluginInstallStatus(name, status) {
      // console.log(`UPDATING PLUGIN STATUS: ${ name } ${ status }`);
      Vue.set(this.installing, name, status);
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
    }
  }
};
</script>

<template>
  <div class="plugins">
    <div class="plugin-header">
      <h2>{{ t('plugins.title') }}</h2>
      <div
        v-if="reloadRequired"
        class="plugin-reload-banner mr-20"
      >
        <i class="icon icon-checkmark mr-10" />
        <span>
          {{ t('plugins.reload') }}
        </span>
        <button
          class="ml-10 btn btn-sm role-primary"
          @click="reload()"
        >
          {{ t('generic.reload') }}
        </button>
      </div>
      <button
        v-if="hasService && hasMenuActions"
        ref="actions"
        aria-haspopup="true"
        type="button"
        class="btn actions role-secondary"
        @click="setMenu"
      >
        <i class="icon icon-actions" />
      </button>
      <ActionMenu
        v-if="hasService && hasMenuActions"
        :custom-actions="menuActions"
        :open="menuOpen"
        :use-custom-target-element="true"
        :custom-target-element="menuTargetElement"
        :custom-target-event="menuTargetEvent"
        @close="setMenu(false)"
        @devLoad="showDeveloperLoaddDialog"
        @removePluginSupport="removePluginSupport"
        @manageRepos="manageRepos"
      />
    </div>

    <PluginInfoPanel ref="infoPanel" />

    <div v-if="!hasService">
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
        @done="updateInstallStatus"
      />
    </div>
    <div v-else>
      <Tabbed
        ref="tabs"
        :tabs-only="true"
        @changed="filterChanged"
      >
        <Tab
          name="installed"
          label-key="plugins.tabs.installed"
          :weight="20"
        />
        <Tab
          name="available"
          label-key="plugins.tabs.available"
          :weight="19"
        />
        <Tab
          name="updates"
          label-key="plugins.tabs.updates"
          :weight="18"
          :badge="updates.length"
        />
        <Tab
          name="all"
          label-key="plugins.tabs.all"
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
          <div
            v-for="plugin in list"
            :key="plugin.name"
            class="plugin"
            @click="showPluginDetail(plugin)"
          >
            <div class="plugin-icon">
              <LazyImage
                v-if="plugin.icon"
                :initial-src="defaultIcon"
                :error-src="defaultIcon"
                :src="plugin.icon"
                class="icon plugin-icon-img"
              />
              <img
                v-else
                :src="defaultIcon"
                class="icon plugin-icon-img"
              >
            </div>
            <div class="plugin-metadata">
              <div class="plugin-name">
                {{ plugin.label }}
              </div>
              <div>{{ plugin.description }}</div>
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
                    v-tooltip="t('plugins.upgradeAvailable')"
                  > -> {{ plugin.upgrade }}</span>
                </span>
              </div>
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
                  v-tooltip="t('plugins.descriptions.third-party')"
                >
                  {{ t('plugins.labels.third-party') }}
                </div>
                <div
                  v-if="plugin.experimental"
                  v-tooltip="t('plugins.descriptions.experimental')"
                >
                  {{ t('plugins.labels.experimental') }}
                </div>
              </div>
              <div class="plugin-spacer" />
              <div class="plugin-actions">
                <template v-if="plugin.error">
                  <div
                    v-tooltip="plugin.error"
                    class="plugin-error"
                  >
                    <i class="icon icon-warning" />
                  </div>
                </template>
                <div
                  v-if="plugin.helmError"
                  v-tooltip="t('plugins.helmError')"
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
                <div
                  v-else-if="plugin.installed"
                  class="plugin-buttons"
                >
                  <button
                    v-if="!plugin.builtin"
                    class="btn role-secondary"
                    @click="showUninstallDialog(plugin, $event)"
                  >
                    {{ t('plugins.uninstall.label') }}
                  </button>
                  <button
                    v-if="plugin.upgrade"
                    class="btn role-secondary"
                    @click="showInstallDialog(plugin, 'update', $event)"
                  >
                    {{ t('plugins.update.label') }}
                  </button>
                  <button
                    v-if="!plugin.upgrade && plugin.versions.length > 1"
                    class="btn role-secondary"
                    @click="showInstallDialog(plugin, 'rollback', $event)"
                  >
                    {{ t('plugins.rollback.label') }}
                  </button>
                </div>
                <div
                  v-else
                  class="plugin-buttons"
                >
                  <button
                    class="btn role-secondary"
                    @click="showInstallDialog(plugin, 'install', $event)"
                  >
                    {{ t('plugins.install.label') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
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
    <DeveloperInstallDialog
      ref="developerInstallDialog"
      @closed="didInstall"
    />
    <RemoveUIPlugins
      ref="removeUIPlugins"
      @done="updateInstallStatus"
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
      font-size: 20px;
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
    margin-bottom: 10px;

    > h2 {
      flex: 1;
      margin-bottom: 0;
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

      .plugin-icon-img {
        height: 40px;
        width: 40px;
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
