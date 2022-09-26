<script>
import FleetClusters from '@shell/components/fleet/FleetClusters';
import { FLEET, MANAGEMENT } from '@shell/config/types';
import { isHarvesterCluster } from '@shell/utils/cluster';
import { Banner } from '@components/Banner';
import ResourceFetch from '@shell/mixins/resource-fetch';

export default {
  name:       'ListCluster',
  components: { Banner, FleetClusters },
  mixins:     [ResourceFetch],
  props:      {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE });
    this.allMgmt = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
    await this.$fetchType(FLEET.CLUSTER);
  },

  data() {
    return { allMgmt: [] };
  },

  computed: {
    allFleet() {
      const inStore = this.$store.getters['currentStore'](FLEET.CLUSTER);

      return this.$store.getters[`${ inStore }/all`](FLEET.CLUSTER);
    },
    loading() {
      return this.allFleet.length ? false : this.$fetchState.pending;
    },
    allClusters() {
      const out = this.allFleet.slice();

      const known = {};

      for ( const c of out ) {
        known[c.metadata.name] = true;
      }

      for ( const c of this.allMgmt ) {
        if ( !known[c.metadata.name] ) {
          out.push(c);
        }
      }

      return out;
    },

    rows() {
      return this.fleetClusters.filter(c => !isHarvesterCluster(c));
    },

    fleetClusters() {
      return this.allClusters.filter(c => c.type === FLEET.CLUSTER);
    },

    hiddenHarvesterCount() {
      return this.fleetClusters.length - this.rows.length;
    },
  },
  // override with relevant info for the loading indicator since this doesn't use it's own masthead
  $loadingResources() {
    return {
      loadResources:     [FLEET.CLUSTER],
      loadIndeterminate: true, // results are filtered so we wouldn't get the correct count on indicator...
    };
  },
};
</script>

<template>
  <div>
    <Banner v-if="hiddenHarvesterCount" color="info" :label="t('fleet.clusters.harvester', {count: hiddenHarvesterCount} )" />
    <FleetClusters
      :rows="rows"
      :schema="schema"
      :loading="loading"
    />
  </div>
</template>
