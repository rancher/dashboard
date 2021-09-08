<script>
import FleetClusters from '@/components/FleetClusters';
import { FLEET, MANAGEMENT } from '@/config/types';
import Loading from '@/components/Loading';
import { filterOnlyKubernetesClusters } from '@/utils/cluster';

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
    kubeMgmtClusters() {
      return filterOnlyKubernetesClusters(this.allMgmt);
    },
    rows() {
      const out = this.allFleet.slice();

      const known = {};

      for ( const c of out ) {
        known[c.metadata.name] = true;
      }

      for ( const c of this.kubeMgmtClusters ) {
        if ( !known[c.metadata.name] ) {
          out.push(c);
        }
      }

      return out;
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
