<script>
import FleetClusters from '@/components/FleetClusters';
import { FLEET, MANAGEMENT } from '@/config/types';
import Loading from '@/components/Loading';
import { isHarvesterCluster } from '@/utils/cluster';

export default {
  name:       'ListCluster',
  components: { FleetClusters, Loading },

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
    rows() {
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

      return out.filter(c => !isHarvesterCluster(c));
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <FleetClusters
    v-else
    :rows="rows"
    :schema="schema"
  />
</template>
