<script lang="ts">
import { PropType } from 'vue';
import { FLEET } from '@shell/config/types';
import FleetResources from '@shell/components/fleet/FleetResources.vue';
import { FleetDashboardState } from '@shell/types/fleet';
import FleetApplicationSource from '@shell/components/formatter/FleetApplicationSource.vue';
import FleetClusters from '@shell/components/fleet/FleetClusters.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import RcDrawer from '@components/RcDrawer/RcDrawer.vue';
import RcDrawerCard from '@components/RcDrawer/RcDrawerCard.vue';
import suseAppCoLogo from '@shell/assets/images/content/suse.svg';
import suseAppCoLogoDark from '@shell/assets/images/content/dark/suse.svg';

export default {
  name: 'FleetDashboardResourceDetails',

  components: {
    FleetResources,
    FleetApplicationSource,
    FleetClusters,
    Tabbed,
    Tab,
    RcDrawer,
    RcDrawerCard,
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

};
</script>

<template>
  <RcDrawer
    :title="value.id"
    :hideFooter="true"
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
          <RcDrawerCard>
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
          </RcDrawerCard>
        </Tab>
        <Tab
          :label="t('fleet.dashboard.resourceDetails.resources')"
          name="resources"
        >
          <RcDrawerCard>
            <FleetResources
              :rows="value.resourcesStatuses"
              :cluster-id="clusterId"
              :search="true"
            />
          </RcDrawerCard>
        </Tab>
        <Tab
          :label="t('fleet.dashboard.resourceDetails.source')"
          name="source"
        >
          <RcDrawerCard>
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
          </RcDrawerCard>
        </Tab>
      </Tabbed>
    </template>
  </RcDrawer>
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
