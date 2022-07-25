<script>
import { mapGetters } from 'vuex';
import FleetClusters from '@shell/components/fleet/FleetClusters';
import { FLEET, MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { isHarvesterCluster } from '@shell/utils/cluster';
import { Banner } from '@components/Banner';

export default {
  name:       'ListCluster',
  components: {
    Banner, FleetClusters, Loading
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE });
    this.allMgmt = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
    this.allFleet = await this.$store.dispatch('management/findAll', { type: FLEET.CLUSTER });
  },

  data() {
    return {
      allMgmt:  null,
      allFleet: null,
    };
  },

  computed: {
    ...mapGetters(['workspace']),
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

    fleetClusters() {
      return this.allClusters.filter(c => c.type === FLEET.CLUSTER);
    },

    workspaceClusters() {
      return this.fleetClusters.filter(c => c.metadata?.namespace === this.workspace);
    },

    rows() {
      return this.workspaceClusters.filter(c => !isHarvesterCluster(c));
    },

    hiddenHarvesterCount() {
      return this.fleetClusters.length - this.rows.length;
    },
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <div v-else>
      <Banner v-if="hiddenHarvesterCount" color="info" :label="t('fleet.clusters.harvester', {count: hiddenHarvesterCount} )" />
      <FleetClusters
        :rows="rows"
        :schema="schema"
      />
    </div>
  </div>
</template>
