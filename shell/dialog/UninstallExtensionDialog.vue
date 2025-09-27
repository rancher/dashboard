<script>
import { mapGetters } from 'vuex';

import AsyncButton from '@shell/components/AsyncButton';
import { CATALOG } from '@shell/config/types';
import { UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';

export default {
  emits: ['close'],

  components: { AsyncButton },

  props: {
    /**
     * Plugin object
     */
    plugin: {
      type:     Object,
      default:  () => {},
      required: true
    },
    /**
     * Callback to update install status on extensions main screen
     */
    updateStatus: {
      type:     Function,
      default:  () => {},
      required: true
    },
    /**
     * Callback when modal is closed
     */
    closed: {
      type:     Function,
      default:  () => {},
      required: true
    },
    resources: {
      type:    Array,
      default: () => []
    },
    registerBackgroundClosing: {
      type:    Function,
      default: () => {}
    }
  },

  data() {
    return { busy: false };
  },

  computed: { ...mapGetters({ allCharts: 'catalog/charts' }) },

  methods: {
    showDialog(plugin) {
      this.plugin = plugin;
      this.busy = false;
    },
    closeDialog(result) {
      this.closed(result);
      this.$emit('close');
    },
    async uninstall() {
      this.busy = true;

      const plugin = this.plugin;

      this.updateStatus(plugin.name, 'uninstall');

      // Delete the CR if this is a developer plugin (there is no Helm App, so need to remove the CRD ourselves)
      if (plugin.uiplugin?.isDeveloper) {
        // Delete the custom resource
        await plugin.uiplugin.remove();
      }

      // Find the app for this plugin
      const apps = await this.$store.dispatch('management/findAll', { type: CATALOG.APP });

      const pluginApp = apps.find((app) => {
        return app.namespace === UI_PLUGIN_NAMESPACE && app.name === plugin.name;
      });

      if (pluginApp) {
        try {
          await pluginApp.remove();
        } catch (e) {
          this.$store.dispatch('growl/error', {
            title:   this.t('plugins.error.generic'),
            message: e.message ? e.message : e,
            timeout: 10000
          }, { root: true });
        }

        await this.$store.dispatch('management/findAll', { type: CATALOG.OPERATION });
      }

      this.closeDialog(plugin);
    }
  }
};
</script>

<template>
  <div class="plugin-install-dialog">
    <h4 class="mt-10">
      {{ t('plugins.uninstall.title', { name: `"${plugin?.label}"` }, true) }}
    </h4>
    <div class="mt-10 dialog-panel">
      <div class="dialog-info">
        <p>
          {{ t('plugins.uninstall.prompt') }}
        </p>
      </div>
      <div class="dialog-buttons">
        <button
          :disabled="busy"
          class="btn role-secondary"
          data-testid="uninstall-ext-modal-cancel-btn"
          @click="closeDialog(false)"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          mode="uninstall"
          :icon="busy ? '' : 'icon-delete'"
          data-testid="uninstall-ext-modal-uninstall-btn"
          @click="uninstall()"
        />
      </div>
    </div>
  </div>
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
