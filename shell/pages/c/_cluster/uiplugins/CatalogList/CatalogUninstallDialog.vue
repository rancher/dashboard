<script>
import { mapGetters } from 'vuex';

import { CATALOG, UI_PLUGIN, SERVICE, WORKLOAD_TYPES } from '@shell/config/types';
import { UI_PLUGIN_LABELS, UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';
import { allHash } from '@shell/utils/promise';

import AsyncButton from '@shell/components/AsyncButton';
import AppModal from '@shell/components/AppModal.vue';

export default {
  emits: ['closed', 'refresh', 'update'],

  components: { AsyncButton, AppModal },

  async fetch() {
    if ( this.$store.getters['management/schemaFor'](UI_PLUGIN) ) {
      const plugins = this.$store.dispatch('management/findAll', { type: UI_PLUGIN });

      this.plugins = plugins || [];
    }
  },

  data() {
    return {
      catalog:             undefined,
      busy:                false,
      plugins:             null,
      showModal:           false,
      returnFocusSelector: '[data-testid="extensions-catalog-load-dialog"]'
    };
  },

  computed: {
    ...mapGetters({ allCharts: 'catalog/charts' }),

    pluginsFromCatalogImage() {
      return this.plugins.filter((p) => p.metadata?.labels?.[UI_PLUGIN_LABELS.CATALOG_IMAGE]);
    }
  },

  methods: {
    showDialog(catalog) {
      this.catalog = catalog;
      this.busy = false;
      this.showModal = true;
    },

    closeDialog(result) {
      this.showModal = false;
      this.$emit('closed', result);

      if ( result ) {
        this.$emit('refresh');
      }
    },

    async uninstall() {
      this.busy = true;

      const catalog = this.catalog;
      const apps = await this.$store.dispatch('management/findAll', { type: CATALOG.APP });
      const pluginApps = apps.filter((app) => {
        if ( app.namespace === UI_PLUGIN_NAMESPACE ) {
          // Find the related apps from the deployed helm repository
          const charts = this.allCharts.filter((chart) => chart.repoName === catalog.repo?.metadata?.name);

          return charts.some((chart) => chart.chartName === app.metadata.name);
        }

        return false;
      });

      await this.removeCatalogResources(catalog);

      if ( pluginApps.length ) {
        try {
          pluginApps.forEach((app) => {
            this.$emit('update', app.name, 'uninstall');
            app.remove();
          });
        } catch (e) {
          this.$store.dispatch('growl/error', {
            title:   this.t('plugins.error.generic'),
            message: e.message ? e.message : e,
            timeout: 10000
          }, { root: true });
        }

        await this.$store.dispatch('management/findAll', { type: CATALOG.OPERATION });
      }

      this.closeDialog(catalog);
    },

    async removeCatalogResources(catalog) {
      const selector = `${ UI_PLUGIN_LABELS.CATALOG_IMAGE }=${ catalog.name }`;
      const namespace = UI_PLUGIN_NAMESPACE;

      if ( selector ) {
        const hash = await allHash({
          deployment: this.$store.dispatch('management/findMatching', {
            type: WORKLOAD_TYPES.DEPLOYMENT, selector, namespace
          }),
          service: this.$store.dispatch('management/findMatching', {
            type: SERVICE, selector, namespace
          }),
          repo: this.$store.dispatch('management/findMatching', { type: CATALOG.CLUSTER_REPO, selector })
        });

        for ( const resource of Object.keys(hash) ) {
          if ( hash[resource] ) {
            hash[resource].forEach((r) => r.remove());
          }
        }
      }
    }
  }
};
</script>

<template>
  <app-modal
    v-if="showModal"
    name="uninstallCatalogDialog"
    height="auto"
    :scrollable="true"
    :trigger-focus-trap="true"
    :return-focus-selector="returnFocusSelector"
    @close="closeDialog(false)"
  >
    <div
      v-if="catalog"
      class="plugin-install-dialog"
    >
      <h4 class="mt-10">
        {{ t('plugins.uninstall.title', { name: catalog.name }) }}
      </h4>
      <div class="mt-10 dialog-panel">
        <div class="dialog-info">
          <p>
            {{ t('plugins.uninstall.catalog') }}
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
