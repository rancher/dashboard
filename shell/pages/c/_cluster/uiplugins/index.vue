<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';

import { DEV } from '@shell/store/prefs';
import { sortBy } from '@shell/utils/sort';
import { allHash } from '@shell/utils/promise';
import { CATALOG, UI_PLUGIN, SCHEMA } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

import ActionMenu from '@shell/components/ActionMenu';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import IconMessage from '@shell/components/IconMessage.vue';
import UninstallDialog from './UninstallDialog.vue';
import InstallDialog from './InstallDialog.vue';
import DeveloperInstallDialog from './DeveloperInstallDialog.vue';
import PluginInfoPanel from './PluginInfoPanel.vue';
import SetupUIPlugins from './SetupUIPlugins';
import RemoveUIPlugins from './RemoveUIPlugins';
import { isUIPlugin, uiPluginHasAnnotation, UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';

export default {
  components: {
    ActionMenu,
    DeveloperInstallDialog,
    IconMessage,
    InstallDialog,
    PluginInfoPanel,
    Tab,
    Tabbed,
    UninstallDialog,
    SetupUIPlugins,
    RemoveUIPlugins,
  },

  data() {
    const menuActions = [];
    const isDeveloper = this.$store.getters['prefs/get'](DEV);

    if (isDeveloper) {
      menuActions.push({
        action:  'devLoad',
        label:   this.t('plugins.devloper.label'),
        enabled: true
      });
      menuActions.push( { divider: true });
    }

    if (this.hasPluginCRD) {
      menuActions.push({
        action:  'removePluginSupport',
        label:   this.t('plugins.setup.remove.label'),
        enabled: true
      });
    }

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
      menuActions,
    };
  },

  layout: 'plain',

  async fetch() {
    const hash = {};

    if (this.hasPluginCRD) {
      hash.plugins = this.$store.dispatch('management/findAll', { type: UI_PLUGIN });
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

    this.loading = false;
  },
  computed: {
    ...mapGetters({ uiplugins: 'uiplugins/plugins' }),
    ...mapGetters({ uiErrors: 'uiplugins/errors' }),

    // Is the Plugin CRD available ?
    hasPluginCRD() {
      const schemas = this.$store.getters[`management/all`](SCHEMA);
      const crd = schemas.find(s => s.id === UI_PLUGIN);

      return !!crd;
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
        const item = {
          name:           chart.chartNameDisplay,
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

        if (this.latest) {
          chart.icon = chart.icon || this.latest.annotations['catalog.cattle.io/iconm'];
        }

        if (this.installing[item.name]) {
          item.installing = this.installing[item.name];
        }

        return item;
      });

      // Go through the CRs for the plugins and wire them into the catalog
      this.plugins.forEach((p) => {
        if (!p.removed) {
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
          }
        }
      });

      // Check that all of the loaded plugins are represented
      this.uiplugins.forEach((p) => {
        const chart = all.find(c => c.name === p.name);

        if (!chart) {
          // A pluign is loaded, but there is no chart, so add an item so that it shows up
          const item = {
            name:           p.name,
            description:    p.metadata?.description,
            id:             p.id,
            versions:       [],
            displayVersion: p.metadata?.version || '-',
            installed:      true,
            builtin:        !!p.builtin,
          };

          all.push(item);
        }
      });

      // Merge in the plugin load errors
      Object.keys(this.uiErrors).forEach((e) => {
        const chart = all.find(c => c.name === e);

        if (chart) {
          chart.error = !!this.uiErrors[e];
        }
      });

      // Merge in the plugin load errors from help ops
      Object.keys(this.errors).forEach((e) => {
        const chart = all.find(c => c.name === e);

        if (chart) {
          chart.helmError = !!this.errors[e];
        }
      });

      return all;
    },
  },

  watch: {
    // hasPluginCRD(neu, old) {
    //   console.log('PLUGIN CRD!!!');
    //   console.log(neu);
    //   console.log(old);
    // },
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
            this.updatePluginInstallStatus(plugin.name, op.status.action);
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

    // TDOO: This is called first off, so we install the plugins again?
    // TODO: Better way to load new plugins when installation has completed?
    plugins(neu, old) {
      console.log('Plugins have changed!!!'); // eslint-disable-line no-console

      const installed = this.$store.getters['uiplugins/plugins'];

      neu.forEach((plugin) => {
        const existing = installed.find(p => !p.removed && p.name === plugin.name);

        if (!existing && plugin.isCached) {
          this.$plugin.loadAsyncByNameAndVersion(plugin.name, plugin.version).catch((e) => {
            console.error(`Failed to load plugin ${ plugin.name } (${ plugin.version })`); // eslint-disable-line no-console
          });

          this.updatePluginInstallStatus(plugin.name, false);
        }
      });
    },
  },

  // Forget the types when we leave the page
  beforeDestroy() {
    this.$store.dispatch('cluster/forgetType', UI_PLUGIN);
    this.$store.dispatch('cluster/forgetType', CATALOG.OPERATION);
    this.$store.dispatch('cluster/forgetType', CATALOG.APP);
    this.$store.dispatch('cluster/forgetType', CATALOG.CLUSTER_REPO);
  },

  methods:    {
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

    showInstallDialog(plugin, ev) {
      ev.target?.blur();
      ev.preventDefault();
      ev.stopPropagation();

      this.$refs.installDialog.showDialog(plugin);
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
    }
  }
};
</script>

<template>
  <div class="plugins">
    <div class="plugin-header">
      <h2>{{ t('plugins.title') }}</h2>
      <button
        v-if="hasPluginCRD && hasMenuActions"
        ref="actions"
        aria-haspopup="true"
        type="button"
        class="btn actions"
        @click="setMenu"
      >
        <i class="icon icon-actions" />
      </button>
      <ActionMenu
        v-if="hasPluginCRD && hasMenuActions"
        :custom-actions="menuActions"
        :open="menuOpen"
        :use-custom-target-element="true"
        :custom-target-element="menuTargetElement"
        :custom-target-event="menuTargetEvent"
        @close="setMenu(false)"
        @devLoad="showDeveloperLoaddDialog"
        @removePluginSupport="removePluginSupport"
      />
    </div>

    <PluginInfoPanel ref="infoPanel" />

    <div v-if="!hasPluginCRD">
      <div v-if="loading" class="data-loading">
        <i class="icon-spin icon icon-spinner" />
        <t k="generic.loading" :raw="true" />
      </div>
      <SetupUIPlugins v-else class="setup-message" />
    </div>
    <div v-else>
      <Tabbed ref="tabs" :tabs-only="true" @changed="filterChanged">
        <Tab name="installed" label-key="plugins.tabs.installed" :weight="20" />
        <Tab name="available" label-key="plugins.tabs.available" :weight="19" />
        <Tab name="updates" label-key="plugins.tabs.updates" :weight="18" :badge="updates.length" />
        <Tab name="all" label-key="plugins.tabs.all" :weight="17" />
      </Tabbed>
      <div v-if="loading" class="data-loading">
        <i class="icon-spin icon icon-spinner" />
        <t k="generic.loading" :raw="true" />
      </div>
      <div v-else class="plugin-list" :class="{'v-margin': !list.length}">
        <IconMessage
          v-if="list.length === 0"
          :vertical="true"
          :subtle="true"
          icon="icon-gear"
          :message="emptyMessage"
        />
        <template v-else>
          <div v-for="plugin in list" :key="plugin.name" class="plugin" @click="showPluginDetail(plugin)">
            <div class="plugin-icon">
              <img v-if="plugin.icon" :src="plugin.icon" class="icon plugin-icon-img" />
              <i v-else class="icon icon-apps"></i>
            </div>
            <div class="plugin-metadata">
              <div class="plugin-name">
                {{ plugin.name }}
              </div>
              <div>{{ plugin.description }}</div>
              <div v-if="plugin.builtin" class="plugin-builtin">
                {{ t('plugins.actions.builtin') }}
              </div>
              <div class="plugin-version">
                <div v-if="plugin.installing" class="plugin-installing">
                  <i class="version-busy icon icon-spin icon-spinner" />
                  <div v-if="plugin.installing='install'">
                    {{ t('plugins.labels.installing') }}
                  </div>
                  <div v-else>
                    {{ t('plugins.labels.uninstalling') }}
                  </div>
                </div>
                <span v-else>
                  <span>{{ plugin.displayVersion }}</span>
                  <span v-if="plugin.upgrade" v-tooltip="t('plugins.upgradeAvailable')"> -> {{ plugin.upgrade }}</span>
                </span>
              </div>
              <div class="plugin-spacer" />
              <div class="plugin-actions">
                <div v-if="plugin.error" v-tooltip="t('plugins.loadError')" class="plugin-error">
                  <i class="icon icon-warning" />
                </div>
                <div v-if="plugin.helmError" v-tooltip="t('plugins.helmError')" class="plugin-error">
                  <i class="icon icon-warning" />
                </div>

                <div class="plugin-spacer" />

                <div v-if="plugin.installing">
                  <!-- Don't show any buttons -->
                </div>
                <div v-else-if="plugin.installed">
                  <button v-if="!plugin.builtin" class="btn role-secondary" @click="showUninstallDialog(plugin, $event)">
                    {{ t('plugins.uninstall.label') }}
                  </button>
                </div>
                <div v-else>
                  <button class="btn role-secondary" @click="showInstallDialog(plugin, $event)">
                    {{ t('plugins.install.label') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <InstallDialog ref="installDialog" @closed="didInstall" @update="updatePluginInstallStatus" />
    <UninstallDialog ref="uninstallDialog" @closed="didUninstall" @update="updatePluginInstallStatus" />
    <DeveloperInstallDialog ref="developerInstallDialog" @closed="didInstall" />
    <RemoveUIPlugins ref="removeUIPlugins" />
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
  }

  .plugin {
    display: flex;
    border: 1px solid var(--border);
    padding: 10px;
    width: calc(33% - 20px);
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
    }

    .plugin-version {
      // border: 1px solid var(--primary);
      align-items: center;
      display: inline-flex;
      font-size: 12px;
      // padding: 2px 5px;
      border-radius: 4px;
      margin: 5px 0;

      i.icon-spinner {
        padding-right: 5px;
        font-size: 16px;
        height: 16px;
        width: 16px;
      }

      .plugin-installing {
        align-items: center;
        display: flex;

        > div {
          font-size: 14px;
          margin-left: 5px;
        }
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
</style>
