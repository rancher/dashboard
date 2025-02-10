<script>
import { mapGetters } from 'vuex';

import AsyncButton from '@shell/components/AsyncButton';
import AppModal from '@shell/components/AppModal.vue';
import { CATALOG } from '@shell/config/types';
import { UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';

export default {
  emits: ['closed', 'update'],

  components: {
    AsyncButton,
    AppModal,
  },

  data() {
    return {
      plugin: undefined, busy: false, showModal: false
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts' }),
    returnFocusSelector() {
      return `[data-testid="extension-card-uninstall-btn-${ this.plugin?.name }"]`;
    }
  },

  methods: {
    showDialog(plugin) {
      this.plugin = plugin;
      this.busy = false;
      this.showModal = true;
    },
    closeDialog(result) {
      this.showModal = false;
      this.$emit('closed', result);
    },
    async uninstall() {
      this.busy = true;

      const plugin = this.plugin;

      this.$emit('update', plugin.name, 'uninstall');

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
  <app-modal
    v-if="showModal"
    name="uninstallPluginDialog"
    height="auto"
    :scrollable="true"
    :trigger-focus-trap="true"
    :return-focus-selector="returnFocusSelector"
    :return-focus-first-iterable-node-selector="'#extensions-main-page'"
    @close="closeDialog(false)"
  >
    <div
      v-if="plugin"
      class="plugin-install-dialog"
    >
      <h4 class="mt-10">
        {{ t('plugins.uninstall.title', { name: plugin.label }) }}
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
            data-testid="uninstall-ext-modal-uninstall-btn"
            @click="uninstall()"
          />
        </div>
      </div>
    </div>
  </app-modal>
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
