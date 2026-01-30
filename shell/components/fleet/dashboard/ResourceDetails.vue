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

  computed: {
    noResources() {
      return !this.value.resourcesStatuses?.length;
    },

    clusterSchema() {
      return this.$store.getters['management/schemaFor'](FLEET.CLUSTER);
    }

  },

  methods: {
    closePanel() {
      this.$store.commit('slideInPanel/close');
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
      <i
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
</style>
