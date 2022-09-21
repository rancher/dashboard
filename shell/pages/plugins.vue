<script>
import { mapGetters } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput },
  data() {
    return {
      name:              '',
      location:          '',
      catalogUrl:        '',
      view:              'installed',
      dialogOpen:        false,
      catalogDialogOpen: false,
      canModifyName:     true,
      canModifyLocation: true,
    };
  },
  layout: 'plain',
  async fetch() {
    await this.$store.dispatch('uiplugins/loadCatalogs');
  },
  computed: {
    ...mapGetters({ plugins: 'uiplugins/plugins' }),
    ...mapGetters({ catalog: 'uiplugins/catalog' }),
    list() {
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

    uninstall(plugin) {
      this.$plugin.removePlugin(plugin.name);
    }
  }
};
</script>

<template>
  <div class="plugins">
    <div class="plugin-header">
      <h2>Plugins</h2>
      <button class="btn role-primary mr-10" @click="showAddCatalogDialog()">
        Add Catalog
      </button>
      <button class="btn role-primary" @click="showAddDialog()">
        Load
      </button>
    </div>
    <br />
    <div class="plugin-list">
      <div v-for="plugin in list" :key="plugin.name" class="plugin">
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
          <div v-if="plugin.installed">
            <!-- <div>{{ plugin.installed.version }}</div> -->
            <div class="plugin-actions">
              <button class="btn role-secondary" @click="uninstall(plugin)">
                Uninstall
              </button>
            </div>
          </div>
          <div v-else class="plugin-actions">
            <button class="btn role-secondary" @click="install(plugin)">
              Install
            </button>
          </div>
        </div>
      </div>
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
            <button class="btn role-secondary" @click="closeAddDialog()">
              Cancel
            </button>
            <button class="btn role-primary" @click="loadPlugin()">
              Load Plugin
            </button>
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
  </div>
</template>

<style lang="scss" scoped>
  .plugin-list {
    display: flex;
    > .plugin:not(:last-child) {
      margin-right: 20px;
    }
  }
  .plugins {
    display: inherit;
  }

  .plugin-add-dialog {
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
      border: 1px solid var(--primary);
      display: inline-block;
      font-size: 12px;
      padding: 2px 5px;
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

</style>
