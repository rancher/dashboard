<script lang="ts">
import { PropType } from 'vue';
import { FLEET } from '@shell/config/types';
import FleetResources from '@shell/components/fleet/FleetResources.vue';
import { FleetDashboardState } from '@shell/types/fleet';
import FleetApplicationSource from '@shell/components/formatter/FleetApplicationSource.vue';
import FleetClusters from '@shell/components/fleet/FleetClusters.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Drawer from '@shell/components/Drawer/Chrome.vue';
import DrawerCard from '@shell/components/Drawer/DrawerCard.vue';
import suseAppCoLogo from '@shell/assets/images/content/suse.svg';
import suseAppCoLogoDark from '@shell/assets/images/content/dark/suse.svg';
import {
  FilterArgs,
  PaginationParamFilter,
  PaginationParamProjectOrNamespace,
  PaginationFilterEquality,
} from '@shell/types/store/pagination.types';

export default {
  name: 'FleetDashboardResourceDetails',

  components: {
    FleetResources,
    FleetApplicationSource,
    FleetClusters,
    Tabbed,
    Tab,
    Drawer,
    DrawerCard,
  },

  props: {
    value: {
      type:     Object,
      required: true
    },

    statePanel: {
      type:     Object as PropType<FleetDashboardState>,
      required: true
    },

    workspace: {
      type:     Object,
      required: true
    }
  },

  data() {
    return {
      FLEET,
      clusterId:      '',
      detailLocation: {
        ...this.value._detailLocation,
        name: 'c-cluster-fleet-application-resource-namespace-id'
      }
    };
  },

  mounted() {
    this.clusterId = '';
  },

  watch: {
    'value.id': {
      immediate: true,
      handler() {
        this.loadApplicationClusters();
      }
    }
  },

  computed: {
    noResources() {
      return !this.value.resourcesStatuses?.length;
    },

    clusterSchema() {
      return this.$store.getters['management/schemaFor'](FLEET.CLUSTER);
    },

    /**
     * SUSE Application Collection bundles use the SUSE AppCo logo instead of the
     * default resource icon font glyph.
     */
    isSuseAppCollection() {
      return !!this.value.isSuseAppCollectionFromUI;
    },

    suseAppCoIcon() {
      return this.$store.getters['prefs/theme'] === 'dark' ? suseAppCoLogoDark : suseAppCoLogo;
    }

  },

  methods: {
    closePanel() {
      this.$store.commit('slideInPanel/close');
    },

    /**
     * The dashboard only loads state-count summaries, so this application's clusters aren't in the
     * store and `value.targetClusters` / `value.resourcesStatuses` resolve to nothing. Load just the
     * clusters it's deployed to - their ids are already in the application's status - so both tabs
     * resolve. Once loaded the model getters recompute reactively.
     */
    async loadApplicationClusters() {
      const ids = [...new Set(Object.keys(this.value.status?.perClusterResourceCounts || {}))].filter((id: string) => id.includes('/'));

      if (!ids.length) {
        return;
      }

      const namespaces = [...new Set(ids.map((id: string) => id.split('/')[0]))];
      const names = [...new Set(ids.map((id: string) => id.split('/')[1]))];

      try {
        await this.$store.dispatch('management/findPage', {
          type: FLEET.CLUSTER,
          opt:  {
            pagination: new FilterArgs({
              projectsOrNamespaces: new PaginationParamProjectOrNamespace({ projectOrNamespace: namespaces }),
              filters:              PaginationParamFilter.createSingleField({
                field: 'metadata.name', value: names.join(','), equality: PaginationFilterEquality.IN
              }),
            })
          }
        });
      } catch (e) {
        // Fallback (e.g. pagination api unavailable): namespace-scoped list.
        try {
          await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER, opt: { namespaced: namespaces[0] } });
        } catch (e2) {
        }
      }
    }
  }
};
</script>

<template>
  <Drawer
    :ariaTarget="value.id"
    :removeFooter="true"
    @close="closePanel"
  >
    <template
      #title
      :data-testid="'fleet-dashboard-resource-details-header'"
    >
      <img
        v-if="isSuseAppCollection"
        class="suse-appco-icon mmr-3"
        :src="suseAppCoIcon"
        :alt="value.nameDisplay"
      >
      <i
        v-else
        class="icon-lg mmr-3"
        :class="value.dashboardIcon"
      />
      <router-link
        class="label"
        :to="detailLocation"
      >
        {{ value.id }}
      </router-link>
      <i
        v-if="statePanel.id !== 'success'"
        class="ml-5 state-icon icon-lg"
        :class="statePanel.icon"
        :style="{ color: statePanel.color }"
      />
    </template>
    <template #body>
      <Tabbed
        v-bind="$attrs"
        :default-tab="'clusters'"
        :resource="value"
        :use-hash="true"
        :remove-borders="true"
      >
        <Tab
          :label="t('fleet.dashboard.resourceDetails.clusters')"
          name="clusters"
        >
          <DrawerCard>
            <FleetClusters
              :schema="clusterSchema"
              :rows="value.targetClusters"
              :table-actions="false"
              :row-actions="false"
              :search="true"
              :remove-sub-rows="true"
              :ignore-filter="true"
              paging-label="sortableTable.paging.resource"
            />
          </DrawerCard>
        </Tab>
        <Tab
          :label="t('fleet.dashboard.resourceDetails.resources')"
          name="resources"
        >
          <DrawerCard>
            <FleetResources
              :rows="value.resourcesStatuses"
              :cluster-id="clusterId"
              :search="true"
            />
          </DrawerCard>
        </Tab>
        <Tab
          :label="t('fleet.dashboard.resourceDetails.source')"
          name="source"
        >
          <DrawerCard class="mmb-4">
            <FleetApplicationSource
              v-if="value.source.value"
              :row="value"
            />
            <div
              v-else
              class="text-muted"
            >
              &mdash;
            </div>
          </DrawerCard>
        </Tab>
      </Tabbed>
    </template>
  </Drawer>
</template>

<style lang="scss" scoped>
  .icon-lg {
    font-size: 24px;
  }

  .suse-appco-icon {
    height: 30px;
    width: 30px;
    object-fit: contain;
    vertical-align: middle;
  }
</style>
