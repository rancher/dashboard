<script>
import { mapGetters } from 'vuex';

import AsyncButton from '@shell/components/AsyncButton';
import { CATALOG } from '@shell/config/types';
import { UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';

/**
 * Dialog shown when user tries to install an extension that is already installed from a different source.
 * Prompts the user to uninstall the existing version first before installing from the new source.
 */
export default {
  emits: ['close'],

  components: { AsyncButton },

  props: {
    /**
     * The installed plugin that needs to be uninstalled
     */
    installedPlugin: {
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
    closeDialog(result) {
      this.closed(result);
      this.$emit('close');
    },
    async uninstall() {
      this.busy = true;

      const plugin = this.installedPlugin;

      this.updateStatus(plugin.id, 'uninstall');

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

          this.busy = false;

          return;
        }

        await this.$store.dispatch('management/findAll', { type: CATALOG.OPERATION });
      }

      // Close the dialog
      this.closeDialog({ uninstalled: true, plugin });
    }
  }
};
</script>

<template>
  <div class="plugin-install-dialog">
    <h4 class="mt-10">
      {{ t('plugins.install.alreadyInstalledTitle') }}
    </h4>
    <div class="mt-10 dialog-panel">
      <div class="dialog-info">
        <p>
          {{ t('plugins.install.alreadyInstalledPrompt') }}
        </p>
      </div>
      <div class="dialog-buttons">
        <button
          :disabled="busy"
          class="btn role-secondary"
          data-testid="uninstall-existing-ext-modal-cancel-btn"
          @click="closeDialog(false)"
        >
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          mode="uninstall"
          :action-label="t('plugins.install.uninstallExisting')"
          data-testid="uninstall-existing-ext-modal-uninstall-btn"
          @click="uninstall()"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import '@shell/assets/styles/base/_mixins.scss';

  .plugin-install-dialog {
    @include extension-dialog;
  }
</style>
