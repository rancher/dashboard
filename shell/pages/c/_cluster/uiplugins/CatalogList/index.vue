<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import ResourceManager from '@shell/mixins/resource-manager';
import { SERVICE, WORKLOAD_TYPES } from '@shell/config/types';
import { UI_PLUGIN_LABELS, UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';
import { UI_PLUGIN_CATALOG } from '@shell/config/table-headers';

import ActionMenu from '@shell/components/ActionMenu';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  name: 'CatalogList',

  props: {
    plugins: {
      type:     Array,
      required: true
    }
  },

  components: { ActionMenu, ResourceTable },

  mixins: [ResourceManager],

  data() {
    const actions = [
      {
        action:  'uninstall',
        label:   this.t('plugins.uninstall.label'),
        icon:    'icon icon-trash',
        enabled: true,
      }
    ];

    return {
      actions,
      catalogHeaders:    UI_PLUGIN_CATALOG,
      menuTargetElement: null,
      menuTargetEvent:   null,
      menuOpen:          false,
    };
  },

  computed: {
    ...mapGetters({ allRepos: 'catalog/repos' }),

    namespacedDeployments() {
      return this.$store.getters['management/all'](WORKLOAD_TYPES.DEPLOYMENT).filter(dep => dep.metadata.namespace === UI_PLUGIN_NAMESPACE);
    },

    namespacedServices() {
      return this.$store.getters['management/all'](SERVICE).filter(svc => svc.metadata.namespace === UI_PLUGIN_NAMESPACE);
    },

    catalogRows() {
      const rows = [];

      if (this.plugins.length) {
        // Find the resources associated with the image by the CATALOG_IMAGE label
        this.plugins.forEach((plugin) => {
          const resources = [this.namespacedDeployments, this.namespacedServices, this.allRepos];
          const pluginName = plugin.metadata?.labels?.[UI_PLUGIN_LABELS.CATALOG_IMAGE];

          if (pluginName) {
            const out = {
              uiplugin:        plugin,
              catalog:         true,
              name:            pluginName,
              state:           plugin.metadata?.state?.name,
              cacheState:      plugin.status?.cacheState,
              version:         plugin.spec?.plugin?.version,
              deployment:      null,
              deploymentImage: null,
              service:         null,
              repo:            null
            };
            const keys = ['deployment', 'service', 'repo'];

            resources.forEach((resource, i) => {
              out[keys[i]] = resource?.filter(item => item.metadata?.labels?.[UI_PLUGIN_LABELS.CATALOG_IMAGE] === pluginName)[0];
            });

            if (!isEmpty(out?.deployment)) {
              out.deploymentImage = out.deployment.spec?.template?.spec?.containers[0]?.image;

              rows.push(out);
            }
          }
        });
      }

      return rows;
    }
  },

  methods: {
    setMenu(event) {
      this.menuOpen = !!event;

      if (event) {
        this.menuTargetElement = this.$refs.catalogActions;
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
  <div class="row mt-20">
    <div class="col span-12">
      <ResourceTable
        :headers="catalogHeaders"
        :rows="catalogRows"
        :paging="true"
        :rows-per-page="10"
        :table-actions="false"
        key-field="name"
      >
        <template #header-left>
          <div>
            <button
              class="btn bg-primary mr-10"
              type="button"
              aria-haspopup="dialog"
              data-testid="extensions-catalog-load-dialog"
              @click="$emit('showCatalogLoadDialog')"
            >
              {{ t('plugins.manageCatalog.imageLoad.load') }}
            </button>
          </div>
        </template>
        <template #row-actions="{row}">
          <button
            ref="catalogActions"
            aria-haspopup="true"
            type="button"
            class="btn btn-sm role-multi-action actions"
            data-testid="extensions-page-catalog-row-menu"
            @click="setMenu"
          >
            <i class="icon icon-actions" />
          </button>
          <ActionMenu
            :custom-actions="actions"
            :open="menuOpen"
            :use-custom-target-element="true"
            :custom-target-element="menuTargetElement"
            :custom-target-event="menuTargetEvent"
            @close="setMenu(false)"
            @uninstall="e => $emit('showUninstallDialog', row, e.event)"
          />
        </template>
      </ResourceTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sub-row {
  border-bottom: 1px solid var(--sortable-table-top-divider);
  padding-left: 1rem;
  padding-right: 1rem;
}

.col {
  display: flex;
  flex-direction: column;

  section {
    margin-bottom: 1.5rem;
  }

  .title {
    margin-bottom: 0.5rem;
  }
}
</style>
