<script>
import AsyncButton from '@shell/components/AsyncButton';
import { CATALOG, UI_PLUGIN } from '@shell/config/types';
import { sortBy } from '@shell/utils/sort';

const PLUGIN_NAMESPACE = 'cattle-ui-plugin-system';

export default {
  components: {
    AsyncButton,
  },

  // props: {
  //   plugin: {
  //     type:     Object,
  //     required: true,
  //   }
  // },
  
  data() {
    console.log('uninstall dialog');
    console.log(this.plugin);

    return { plugin: undefined, busy: false };
  },

  methods: {
    showDialog(plugin) {
      this.plugin = plugin;
      this.busy = false;
      this.$modal.show('uninstallPluginDialog');
    },
    closeDialog(result) {
      console.log('!!!!!!!');
      console.log(result);
      this.$modal.hide('uninstallPluginDialog');
      this.$emit('closed', result);
    },
    async uninstall() {
      console.log('UNINSTALL !!!!!');
      console.log(this);
      this.busy = true;

      const plugin = this.plugin;

      if (plugin.uiplugin) {
        // Delete the custom resource
        // await plugin.uiplugin.remove();
      }

      // Find the app for this plugin
      const apps = await this.$store.dispatch('management/findAll', { type: CATALOG.APP });

      const pluginApp = apps.find((app) => {
        return app.namespace == PLUGIN_NAMESPACE && app.name === plugin.name;
      });

      if (pluginApp) {
        console.log('Going to remove app for plugin');
        const remove = await pluginApp.remove();

        console.warn('REMOVE');
        console.log(remove);

        const helmOps = await this.$store.dispatch('management/findAll', { type: CATALOG.OPERATION });

        let pluginOps = helmOps.filter((op) => {
          return op.namespace === PLUGIN_NAMESPACE && op.status?.releaseName === plugin.name && op.status?.action === 'uninstall';
        });

        console.log('Plugin ops');
        console.log(pluginOps);
        
        // Sort them so that the newest is first - this will be the latest uninstall operation for the plugin
        pluginOps = sortBy(pluginOps, 'metadata.creationTimestamp', true);

        if (pluginOps.length > 0) {
          // plugin.operation = pluginOps[0];
          console.warn('FOUND OP FOR PLUGIN *********');
          console.log(pluginOps[0]);
        }
      }

      // Unload the plugin code
      this.$plugin.removePlugin(plugin.name);

      this.closeDialog(plugin);
    }
  }
}
</script>

<template>
  <modal
    name="uninstallPluginDialog"
    height="auto"
    :scrollable="true"
  >
    <div v-if="plugin" class="plugin-install-dialog">
      <h4 class="mt-10">
        Uninstall Plugin: {{ plugin.name }}
      </h4>
      <div class="mt-10 dialog-panel">
        <div class="dialog-info">
          <p>Are you sure that you want to uninstall this plugin?</p>
        </div>
        <div class="dialog-buttons">
          <button :disabled="busy" class="btn role-secondary" @click="closeDialog(false)">
            Cancel
          </button>
          <AsyncButton
            mode="uninstall"
            @click="uninstall()"
          />
        </div>
      </div>
    </div>
  </modal>
</template>

<style lang="scss" scoped>
  .plugin-install-dialog {
    padding: 10px;

    h4 {
      font-weight: bold;
    }

    .dialog-panel {
      display: flex;
      flex-direction: column;
      min-height: 100px;

      .dialog-info {
        flex: 1;
      }
    }

    .dialog-buttons {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;

      > *:not(:last-child) {
        margin-right: 10px;
      }
    }
  }
</style>
