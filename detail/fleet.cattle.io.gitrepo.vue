<script>
import ResourceTabs from '@/components/form/ResourceTabs';
// import ResourcesSummary from '@/components/fleet/ResourcesSummary';
import FleetResources from '@/components/fleet/FleetResources';
import TreeChart from '@/components/fleet/TreeChart';
import Tab from '@/components/Tabbed/Tab';
import { FLEET } from '@/config/types';
import { allHash } from '@/utils/promise';

export default {
  name: 'DetailGitRepo',

  components: {
    FleetResources,
    // ResourcesSummary,
    ResourceTabs,
    TreeChart,
    Tab,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  // async fetch() {
  //   await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
  //   await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });
  // },

  async fetch() {
    await allHash({
      bundles:      this.$store.dispatch('management/findAll', { type: FLEET.BUNDLE }),
      cluster:      this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER }),
      clusterGroup: this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP }),
    });
  },
};
</script>

<template>
  <div class="mt-20">
    <!-- <ResourcesSummary :value="value.status.resourceCounts" /> -->
    <TreeChart :data="value" />

    <ResourceTabs v-model="value" mode="view" class="mt-20">
      <Tab label="Resources" name="resources" :weight="20">
        <FleetResources :value="value" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
