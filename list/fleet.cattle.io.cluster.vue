<script>
import FleetClusters from '@/components/FleetClusters';
import { get } from '@/utils/object';
import { mapPref, GROUP_RESOURCES } from '@/store/prefs';
import { FLEET, MANAGEMENT } from '@/config/types';
import Loading from '@/components/Loading';

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

      return out;
    },

    group: mapPref(GROUP_RESOURCES),

    groupBy() {
      // The value of the preference is "namespace" but we take that to mean group by workspace here...
      if ( this.group === 'namespace') {
        return 'groupByLabel';
      }

      return null;
    },

    groupOptions() {
      return [
        { value: 'none', icon: 'icon-list-flat' },
        { value: 'namespace', icon: 'icon-list-grouped' }
      ];
    },
  },

  methods: {
    get,

    setGroup(group) {
      this.group = group;
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <FleetClusters
    v-else
    :rows="rows"
    :groupable="true"
    :group-by="groupBy"
    :group-options="groupOptions"
    :group="group"
    :paging="true"
    paging-label="sortableTable.paging.resource"
    @set-group="setGroup"
  />
</template>
