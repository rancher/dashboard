<script>
import Vue from 'vue';
import { mapGetters } from 'vuex';

import { sortBy } from '@shell/utils/sort';
import { allHash } from '@shell/utils/promise';
import { CATALOG, UI_PLUGIN } from '@shell/config/types';

import ActionMenu from '@shell/components/ActionMenu';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import IconMessage from '@shell/components/IconMessage.vue';
import UninstallDialog from './UninstallDialog.vue';
import InstallDialog from './InstallDialog.vue';
import DeveloperInstallDialog from './DeveloperInstallDialog.vue';
import PluginInfoPanel from './PluginInfoPanel.vue';

// const PLUGIN_CHART_ANNOTATION = 'uiplugin.cattle.io';

// TODO: Typo in this annotation
const PLUGIN_CHART_ANNOTATION = 'uipluign.cattle.io';

const PLUGIN_NAMESPACE = 'cattle-ui-plugin-system';

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
  },
  data() {
    const menuActions = [];
    const isDeveloper = true;

    if (isDeveloper) {
      menuActions.push({
        action:  'devLoad',
        label:   this.t('plugins.actions.developerLoad'),
        enabled: true
      });
    }

    return {
      view:              '',
      charts:            [],
      installing:        {},
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

    if (this.$store.getters['management/schemaFor'](UI_PLUGIN)) {
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

    isDeveloper() {
      return true;
    },

    // Message to display when the tab view is empty (depends on the tab)
    emptyMessage() {
      return this.t(`plugins.empty.${ this.view }`);
    },

    updates() {
      return this.available.filter(plugin => !!plugin.upgrade);
    },

    available() {
      let all = this.charts.filter(c => !!c.versions.find(v => v.annotations && v.annotations[PLUGIN_CHART_ANNOTATION] === 'true'));

      all = all.map((chart) => {
        const item = {
          name:           chart.chartNameDisplay,
          description:    chart.chartDescription,
          id:             chart.id,
          versions:       [],
          displayVersion: chart.versions?.length > 0 ? chart.versions[0].version : '',
          installed:      false,
          builtin:        false,
        };

        this.latest = chart.versions[0];
        item.versions = [...chart.versions];
        item.chart = chart;

        if (this.installing[item.name]) {
          console.log(`PLUGIN IS BEING INSTALLED: ${ item.name } ${ this.installing[item.name] }`); // eslint-disable-line no-console
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

      return all;
    },
  },

  watch: {
    helmOps(neu) {
      // Get Helm operations for UI plugins and order by date
      let pluginOps = neu.filter((op) => {
        return op.namespace === PLUGIN_NAMESPACE;
      });

      pluginOps = sortBy(pluginOps, 'metadata.creationTimestamp', true);

      // Go through the installed plugins
      (this.available || []).forEach((plugin) => {
        const op = pluginOps.find(o => o.status?.releaseName === plugin.name);

        if (op) {
          const active = op.metadata.state?.transitioning;

          // console.log(active);
          // console.log(op.status.action);

          if (active) {
            this.updatePluginInstallStatus(plugin.name, op.status.action);
          } else if (op.status.action === 'uninstall') {
            // Uninstall has finished
            this.updatePluginInstallStatus(plugin.name, false);
          }
        } else {
          this.updatePluginInstallStatus(plugin.name, false);
        }
      });
    },

    // TDOO: This is called first off, so we install the plugins again
    plugins(neu, old) {
      console.log('Plugins have changed!!!'); // eslint-disable-line no-console

      const installed = this.$store.getters['uiplugins/plugins'];

      neu.forEach((plugin) => {
        const existing = installed.find(p => !p.removed && p.name === plugin.name);

        if (!existing) {
          console.error('!!!!!!!!!!!!!!! NEW PLUGIN!'); // eslint-disable-line no-console
          console.log(plugin); // eslint-disable-line no-console

          const id = `${ plugin.name }-${ plugin.version }`;
          const url = `http://127.0.0.1:4500/${ id }/${ id }.umd.min.js`;

          console.error(`Load Plugin ${ id } ${ url }`); // eslint-disable-line no-console

          this.$plugin.loadAsync(id, url).catch((e) => {
            console.log('Failed to load plugin'); // eslint-disable-line no-console
          });

          this.updatePluginInstallStatus(plugin.name, false);
        }
      });
    },

  },
  methods:    {
    filterChanged(f) {
      this.view = f.selectedName;
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
      console.log(`UPDATING PLUGIN STATUS: ${ name } ${ status }`); // eslint-disable-line no-console
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
        v-if="menuActions.length > 0"
        ref="actions"
        aria-haspopup="true"
        type="button"
        class="btn actions"
        @click="setMenu"
      >
        <i class="icon icon-actions" />
      </button>
      <ActionMenu
        :custom-actions="menuActions"
        :open="menuOpen"
        :use-custom-target-element="true"
        :custom-target-element="menuTargetElement"
        :custom-target-event="menuTargetEvent"
        @close="setMenu(false)"
        @devLoad="showDeveloperLoaddDialog"
      />
    </div>

    <PluginInfoPanel ref="infoPanel" />

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
              Built-in plugin
            </div>
            <div class="plugin-version">
              <i v-if="plugin.installing" class="version-busy icon icon-spin icon-spinner" />
              <span v-else>
                <span>{{ plugin.displayVersion }}</span>
                <span v-if="plugin.upgrade" v-tooltip="'A newer version of this UI Plugin is available'"> -> {{ plugin.upgrade }}</span>
              </span>
            </div>
            <div class="plugin-spacer" />
            <div class="plugin-actions">
              <div v-if="plugin.error" v-tooltip="t('plugins.loadError')" class="plugin-error">
                <i class="icon icon-warning" />
              </div>

              <div class="plugin-spacer" />

              <div v-if="plugin.installing">
                {{ plugin.installing }}ing ...
              </div>
              <div v-else-if="plugin.installed">
                <button v-if="!plugin.builtin" class="btn role-secondary" @click="showUninstallDialog(plugin, $event)">
                  Uninstall
                </button>
              </div>
              <div v-else>
                <button class="btn role-secondary" @click="showInstallDialog(plugin, $event)">
                  Install
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <InstallDialog ref="installDialog" @closed="didInstall" @update="updatePluginInstallStatus" />
    <UninstallDialog ref="uninstallDialog" @closed="didUninstall" @update="updatePluginInstallStatus" />
    <DeveloperInstallDialog ref="developerInstallDialog" @closed="didInstall" />
  </div>
</template>

<style lang="scss" scoped>
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

  .plugin-add-dialog, .plugin-install-dialog {
    padding: 10px;

    .dialog-buttons {
      display: flex;
      justify-content: flex-end;

      > *:not(:last-child) {
        margin-right: 10px;
      }
    }
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
    width: 320px;
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

  .fields {
    display: flex;
    // > div:first-child {
    //   width: 260px;
    //   margin-right: 20px;
    // }
  }

  .custom {
    button {
      margin-top: 10px;
    }
  }

  .plugin-install-dialog {
    h4 {
      font-weight: bold;
    }

    .install-info {
      p {
        margin-bottom: 10px;
      }
    }
  }
</style>
