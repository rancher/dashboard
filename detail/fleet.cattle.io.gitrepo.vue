<script>
import ResourceTabs from '@/components/form/ResourceTabs';
import FleetSummary from '@/components/fleet/FleetSummary';
import FleetResources from '@/components/fleet/FleetResources';
import Tab from '@/components/Tabbed/Tab';
import { FLEET } from '@/config/types';

export default {
  name: 'DetailGitRepo',

  components: {
    FleetResources,
    FleetSummary,
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
};
</script>

<template>
  <div class="mt-20">
    <FleetSummary :value="value.status.resourceCounts" />

    <ResourceTabs v-model="value" mode="view" class="mt-20">
      <Tab label="Resources" name="resources" :weight="20">
        <FleetResources :value="value" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
