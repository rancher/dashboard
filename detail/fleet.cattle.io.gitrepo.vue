<script>
import ResourceTabs from '@/components/form/ResourceTabs';
import ResourcesSummary from '@/components/fleet/ResourcesSummary';
import Banner from '@/components/Banner';
import FleetResources from '@/components/fleet/FleetResources';
import Tab from '@/components/Tabbed/Tab';
import { FLEET } from '@/config/types';

export default {
  name: 'DetailGitRepo',

  components: {
    FleetResources,
    ResourcesSummary,
    Banner,
    ResourceTabs,
    Tab,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
    await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER_GROUP });
  },
  computed: {
    gitRepoHasClusters() {
      return this.value.status.desiredReadyClusters;
    }
  },
};
</script>

<template>
  <div class="mt-20">
    <ResourcesSummary
      v-if="gitRepoHasClusters"
      :value="value.status.resourceCounts"
    />
    <Banner
      v-else
      color="info"
      class="mb-40"
    >
      {{ t('fleet.fleetSummary.noClustersGitRepo') }}
    </Banner>

    <ResourceTabs v-model="value" mode="view" class="mt-20">
      <Tab label="Resources" name="resources" :weight="20">
        <FleetResources :value="value" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
