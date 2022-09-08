<script>
import Vue from 'vue';

import { sortBy } from '@shell/utils/sort';
import { allHash } from '@shell/utils/promise';
import { LabeledInput } from '@components/Form/LabeledInput';
import { CATALOG, UI_PLUGIN } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import AsyncButton from '@shell/components/AsyncButton';

import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import IconMessage from '@shell/components/IconMessage.vue';
import UninstallDialog from './UninstallDialog.vue';

// const PLUGIN_CHART_ANNOTATION = 'uiplugin.cattle.io';

// TODO: Typo in this annotation
const PLUGIN_CHART_ANNOTATION = 'uipluign.cattle.io';

const PLUGIN_NAMESPACE = 'cattle-ui-plugin-system';

export default {
  components: {
    AsyncButton,
    LabeledInput,
    IconMessage,
    Tabbed,
    Tab,
    UninstallDialog,
  },
  data() {
    return {
      name:              '',
      location:          '',
      catalogUrl:        '',
      view:              '',
      dialogOpen:        false,
      catalogDialogOpen: false,
      installDialogOpen: false,
      canModifyName:     true,
      canModifyLocation: true,
      charts:            [],
      selected:          undefined,
      installing:        {},
      dialogBusy:        false,
      plugins:           [], // The installed plugins
      helmOps:           [], // Helm operations
      loading:           true,
      showSlideIn:       false,
      info:              undefined,

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
    // TODO: Remove these
    // ...mapGetters({ plugins: 'uiplugins/plugins' }),
    // ...mapGetters({ catalog: 'uiplugins/catalog' }),

    list() {
      const all = this.available;

      switch (this.view) {
        case 'installed': 
          return all.filter(p => !!p.installed || !!p.installing);
        case 'available':
          return all.filter(p => !p.installed);
        default:
          return all;
      }
    },

    available() {
      let all = this.charts.filter(c => !!c.versions.find(v => v.annotations && v.annotations[PLUGIN_CHART_ANNOTATION] === 'true'));

      all = all.map(chart => {
        const item = {
          name:        chart.chartNameDisplay,
          description: chart.chartDescription,
          id: chart.id,
          versions: [],
          displayVersion: chart.versions?.length > 0 ? chart.versions[0].version : '',
          installed: false,
          builtin: false,
        }

        console.log(chart);

        item.versions.push(chart.versions[0]);
        item.chart = chart;

        console.log('recompute');
        console.log(this.installing);

        if (this.installing[item.name]) {
          console.log('PLUGIN IS BEING INSTALLED: ' + item.name + ' ' + this.installing[item.name]);
          item.installing = this.installing[item.name];
        }

        return item;
      });

      // Go through the CRs for the plugins and wire them into the catalog
      this.plugins.forEach(p => {
        const chart = all.find(c => c.name === p.name);
        if (chart) {
          chart.installed = true;
          chart.uiplugin = p;
          chart.displayVersion = p.version;
          chart.installing = false;
        }
      });

      return all;
    },

    _list() {
      // Get installed plugins and mark up the list
      const pMap = {};
      const list = [];
      // Map of plugins in the catalog
      const cMap = {};

      this.plugins.forEach((p) => {
        pMap[p.name] = p;
      });

      this.catalog.forEach((catalogItem) => {
        const item = { ...catalogItem };

        list.push(item);
        cMap[item.name] = true;

        item.installed = pMap[item.name]?.metadata;
        item.builtin = !!pMap[item.name]?.builtin;
        item.displayVersion = item.installed ? item.installed.version : item.version;
        item.icon = item.installed?.icon;
        item.download = `/download-pkg/${ item.name }-${ item.version }`;

        if (item.installed) {
          if (item.installed.version !== item.version) {
            // TODO: Only if newer
            item.upgrade = item.version;
          }
        }
      });

      this.plugins.forEach((p) => {
        if (!cMap[p.name]) {
          // Plugin is installed but not in the catalog, so add item for it
          list.push({
            ...p.metadata,
            installed:      true,
            builtin:        p.builtin,
            displayVersion: p.metadata?.version,
            icon:           p.metadata?.icon
          });
        }
      });

      return list;
    }
  },
  watch: {
    helmOps(neu) {
      console.log('HELM OP');
      // console.log(neu);

      // Get Helm operations for UI plugins and order by date
      let pluginOps = neu.filter((op) => {
        return op.namespace === PLUGIN_NAMESPACE;
      });

      pluginOps = sortBy(pluginOps, 'metadata.creationTimestamp', true);

      console.log(pluginOps);

      const found = {};

      // Go through the installed plugins
      (this.available || []).forEach((plugin) => {
        console.log('Checking plugin: ' + plugin.name);

        const op = pluginOps.find(o => o.status?.releaseName === plugin.name);

        console.log('Found op for plugin');

        if (op) {
          const active = op.metadata.state?.transitioning;

          console.log(active);
          console.log(op.status.action);

          if (active) {
            Vue.set(this.installing, plugin.name, op.status.action);
          } else if (op.status === 'uninstall') {
            // Uninstall has finished
            Vue.set(this.installing, plugin.name, false);
          }
        } else {
            Vue.set(this.installing, plugin.name, false);
        }

        // plugin.operation = op;
        // if (!plugin.operation) {
        //   Vue.set(plugin, 'installing', false);
        // } else {
        //   Vue.set(plugin, 'installing', true);
        // }
      });
    },

    plugins(neu, old) {
      console.log('Plugins have changed!!!');

      console.log(neu);
      
      const installed = this.$store.getters['uiplugins/plugins'];

      console.log(installed);

      neu.forEach((plugin) => {
        const existing = installed.find(p => !p.removed && p.name === plugin.name);

        console.log(existing);
        console.log(plugin);

        if (!existing) {
          console.error('!!!!!!!!!!!!!!! NEW PLUGIN!');
          console.log(plugin);

          const id = `${ plugin.name }-${ plugin.version }`;
          const url = `http://127.0.0.1:4500/${ id }/${ id }.umd.min.js`;

          console.error('Load Plugin ' + id + ' ' + url);

          this.$plugin.loadAsync(id, url);
        }
      });
    },

    name(neu, old) {
      if (this.canModifyLocation) {
        this.location = `/pkg/${ neu }/${ neu }.umd.min.js`;
      }
    },
    location(neu, old) {
      if (this.canModifyName) {
        const names = neu.split('/');
        let last = names[names.length - 1];
        const index = last.indexOf('.umd.min.js');

        if (index !== -1) {
          last = last.substr(0, index);
        }

        this.name = last;
      }
    }
  },
  methods:    {
    filterChanged(f) {
      console.log('FILTER CHANGED');
      console.log(f.selectedName);
      this.view = f.selectedName;

      console.log(this.$refs.tabs);
    },
    updateName(v) {
      this.canModifyName = v.length === 0;
    },
    updateLocation(v) {
      this.canModifyLocation = v.length === 0;
    },
    showAddDialog() {
      this.dialogOpen = true;
      this.$modal.show('addPluginDialog');
    },

    closeAddDialog() {
      this.dialogOpen = false;
      this.$modal.hide('addPluginDialog');
    },

    showAddCatalogDialog() {
      this.catalogDialogOpen = true;
      this.$modal.show('addCatlogDialog');
    },
    closeAddCatalogDialog() {
      this.catalogDialogOpen = false;
      this.$modal.hide('addCatlogDialog');
    },

    showInstallDialog(plugin, ev) {
      this.dialogBusy = false;
      this.selected = plugin;
      this.installDialogOpen = true;
      this.$modal.show('installDialog');

      ev.preventDefault();
      ev.stopPropagation();
    },
    closeInstallDialog() {
      this.dialogBusy = false;
      this.selected = undefined;
      this.installDialogOpen = false;
      this.$modal.hide('installDialog');
    },    

    addCatalog() {
      this.$store.dispatch('uiplugins/addCatalog', this.catalogUrl);
      this.$store.dispatch('uiplugins/loadCatalogs');
      this.closeAddCatalogDialog();
    },

    loadPlugin() {
      this.load(this.name, this.location);
    },

    load(name, url) {
      if (!name) {
        const parts = url.split('/');
        const n = parts[parts.length - 1];

        name = n.split('.')[0];
      }

      this.$plugin.loadAsync(name, url).then(() => {
        this.closeAddDialog();
        this.$store.dispatch('growl/success', {
          title:   `Loaded plugin ${ name }`,
          message: `Plugin was loaded successfully`,
          timeout: 3000,
        }, { root: true });
      }).catch((error) => {
        this.closeAddDialog();
        const message = typeof error === 'object' ? 'Could not load code' : error;

        this.$store.dispatch('growl/error', {
          title:   'Error loading plugin',
          message,
          timeout: 5000
        }, { root: true });
      });
    },

    // Install the helm chart for the plugin
    async installPlugin() {
      console.log('INSTALL PLUGIN');
      console.log(this.selected);

      // Vue.set(this.installed, this.selected.name, 'install');

      this.dialogBusy = true;

      const version = this.selected.versions[0];
      const repoType = version.repoType;
      const repoName = version.repoName;
      const repo = this.$store.getters['catalog/repo']({repoType, repoName});

      console.log(repo);

      const chart = {
        chartName:   this.selected.chart.chartName,
        version:     version.version,
        releaseName: this.selected.chart.chartName,
        annotations: {
          [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: this.selected.repoType,
          [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: this.selected.repoName
        },
        values: {}
      };

      const input = {
        charts:    [chart],
        //timeout:   this.cmdOptions.timeout > 0 ? `${ this.cmdOptions.timeout }s` : null,
        //wait:      this.cmdOptions.wait === true,
        namespace: PLUGIN_NAMESPACE,
        //projectId: this.project,
      };

      const action = 'install';

      const name = this.selected.chart.chartName;

      //const res = await this.repo.doAction((isUpgrade ? 'upgrade' : 'install'), input);
      const res = await repo.doAction(action, input);
      const operationId = `${ res.operationNamespace }/${ res.operationName }`;

      // Vue.set(this.installing, this.selected.chart.chartName, operationId);

      // Change the view to installed
      this.$refs.tabs?.select('installed');

      this.closeInstallDialog();

      console.log(res);
      console.log(operationId);

      await repo.waitForOperation(operationId);

      const operation = await this.$store.dispatch(`management/find`, {
        type: CATALOG.OPERATION,
        id:   operationId
      });

      console.log(operation);

      console.log('OK');

      // Vue.set(this.installing, name, operation);

      console.log(this.installing);
    },

    async install(plugin) {
      // Might need to download the package first
      if (plugin.download) {
        await this.$store.dispatch('rancher/request', { url: plugin.download }, { root: true });
      }

      const name = `${ plugin.name }-${ plugin.version }`;
      let moduleUrl = `/pkg/${ name }/${ name }.umd.min.js`;

      if (plugin.location) {
        moduleUrl = `${ plugin.location }/${ name }/${ name }.umd.min.js`;
      }

      this.load(name, moduleUrl);
    },

    // Uninstall plugin
    // Prompt for confirmation, delete CR and remove Helm app
    uninstall(plugin, ev) {
      ev.target?.blur();
      ev.preventDefault();
      ev.stopPropagation();

      console.log('Uninstall!!');
      console.log(plugin);

      this.$refs.uninstallDialog.showDialog(plugin);

      // TODO: Confirmation

      // TODO: Busy action

      // if (plugin.uiplugin) {
      //   // Delete the custom resource
      //   // await plugin.uiplugin.remove();
      // }

      // // Find the app for this plugin
      // const apps = await this.$store.dispatch('management/findAll', { type: CATALOG.APP });

      // const pluginApp = apps.find((app) => {
      //   return app.namespace == PLUGIN_NAMESPACE && app.name === plugin.name;
      // });

      // if (pluginApp) {
      //   console.log('Going to remove app for plugin');
      //   const remove = await pluginApp.remove();

      //   console.log(remove);
      // }

      // // Unload the plugin code
      // this.$plugin.removePlugin(plugin.name);
    },

    didUninstall(plugin) {
      if (plugin) {
        console.error('!!!!!!! DID UNINSTALL');

        console.log(plugin);

        Vue.set(plugin, 'installed', false);
        Vue.set(plugin, 'installing', false);

        console.log(plugin.name);
        console.log(this.installed);

        // Vue.set(this.installed, plugin.name, false);
      }
    },

    showPluginDetail(plugin) {
      this.showSlideIn = true;
      this.info = plugin;

      console.log(plugin);
    }
  }
};
</script>

<template>
  <div class="plugins">
    <div class="plugin-header">
      <h2>Plugins</h2>
      <!-- TODO: NEED TO BRING IN DEVELOPER SUPPORT FOR LOADING A PLUGIN -->
      <!--
      <button class="btn role-primary mr-10" @click="showAddCatalogDialog()">
        Add Catalog
      </button>
      <button class="btn role-primary" @click="showAddDialog()">
        Load
      </button>
      -->
    </div>
    <br />

    <div v-if="showSlideIn" class="glass" @click="showSlideIn = false" />

    <div class="slideIn" :class="{'hide': false, 'slideIn__show': showSlideIn}">
      <div v-if="info">
        <h2 class="slideIn__header">
          {{ info.name }}
          <div class="slideIn__header__buttons">
            <div class="slideIn__header__button" @click="showSlideIn = false">
              <i class="icon icon-close" />
            </div>
          </div>
        </h2>
        <p>{{ info.description }}</p>
        <h3>Versions</h3>
        <ul>
          <li v-for="v in info.versions" :key="v.version">
            {{ v.version }}
          </li>
        </ul>

        <h3>Readme goes here</h3>
      </div>
      <!--
      <ChartReadme v-if="hasReadme" :version-info="versionInfo" class="chart-content__tabs" />
      -->
    </div>

    <Tabbed :tabs-only="true" ref="tabs" @changed="filterChanged">
      <Tab name="installed" label="Installed" :weight="20" />
      <Tab name="available" label="Available" :weight="19"  />
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
        message="No Plugins installed"
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
              {{ plugin.displayVersion }}
            </div>
            <!--
              <button class="btn role-secondary" @click="showPluginDetail(plugin)">
                Info
              </button>
              -->

            <div v-if="plugin.installing">
              <div class="plugin-actions">
                {{ plugin.installing }}ing ...
              </div>
            </div>

            <div v-else-if="plugin.installed">
              <!-- <div>{{ plugin.installed.version }}</div> -->
              <div class="plugin-actions">
                <button class="btn role-secondary" @click="uninstall(plugin, $event)">
                  Uninstall
                </button>
              </div>
            </div>
            <div v-else class="plugin-actions">
              <button class="btn role-secondary" @click="showInstallDialog(plugin, $event)">
                Install
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <modal
      name="addPluginDialog"
      height="auto"
      :scrollable="true"
      @closed="closeAddDialog()"
    >
      <div class="plugin-add-dialog">
        <h4 class="mt-20">
          Load Plugin
        </h4>
        <div class="custom">
          <div class="fields">
            <LabeledInput v-model="name" v-focus label="Plugin module name" @input="updateName" />
          </div>
        </div>
        <div class="custom mt-10">
          <div class="fields">
            <LabeledInput v-model="location" label="Plugin URL" @input="updateLocation" />
          </div>
          <div class="dialog-buttons">
            <!--
            <button class="btn role-secondary" @click="closeAddDialog()">
              Cancel
            </button>
            <button class="btn role-primary" @click="loadPlugin()">
              Load Plugin
            </button>
            -->
          </div>
        </div>
      </div>
    </modal>

    <modal
      name="addCatlogDialog"
      height="auto"
      :scrollable="true"
      @closed="closeAddCatalogDialog()"
    >
      <div class="plugin-add-dialog">
        <h4 class="mt-20">
          Add Plugin Catalog
        </h4>
        <div class="custom mt-10">
          <div class="fields">
            <LabeledInput v-model="catalogUrl" label="Catalog URL" />
          </div>
          <div class="dialog-buttons">
            <button class="btn role-secondary" @click="closeAddCatalogDialog()">
              Cancel
            </button>
            <button class="btn role-primary" @click="addCatalog()">
              Add
            </button>
          </div>
        </div>
      </div>
    </modal>

    <UninstallDialog ref="uninstallDialog" @closed="didUninstall" />

    <modal
      name="installDialog"
      height="auto"
      :scrollable="true"
      @closed="closeInstallDialog()"
    >
      <div v-if="selected" class="plugin-install-dialog">
        <h4 class="mt-10">
          Install Plugin: {{ selected.name }}
        </h4>
        <div class="custom mt-10">
          <div class="install-info">
            <p>Are you sure that you want to install this plugin?</p>
            <p>Please ensure that you are aware of the risks of installing plugins from untrusted authors.</p>
          </div>
          <div class="dialog-buttons">
            <button :disbaled="dialogBusy" class="btn role-secondary" @click="closeInstallDialog()">
              Cancel
            </button>
            <AsyncButton
              mode="install"
              @click="installPlugin"
            />            
          </div>
        </div>
      </div>
    </modal>

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

    .plugin-metadata {
      flex: 1;
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
      display: inline-block;
      font-size: 12px;
      // padding: 2px 5px;
      border-radius: 4px;
      margin: 5px 0;
    }

    .plugin-actions {
      display: flex;
      justify-content: flex-end;

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
      font-size: 16px;
      margin-top: 10px;
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
