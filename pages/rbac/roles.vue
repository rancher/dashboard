<script>

import { RBAC } from '@/config/types';
import LoadDeps from '@/mixins/load-deps';
import { allHash } from '@/utils/promise';
import Loading from '@/components/Loading';

/* route in this case is the nested route under rbac/roles/<global/cluster> */
const Tabs = [
  {
    label:     'Global Roles',
    name:      'global',
    route:     'global',
  },
  {
    label:     'Cluster Roles',
    name:      'cluster',
    route:     'cluster',
  },
];

/**
 * Parent container for Cluster/Global role resources
   @displayName RBAC Resource
 */
export default {
  name: 'RBACResource',

  components: { Loading },

  mixins: [LoadDeps],

  data() {
    return { tabs: Tabs };
  },

  methods: {
    /**
     * Returns global and cluster rows ( ansync )
     */
    async loadDeps() {
      const hash = await allHash({
        globalRows:  this.$store.dispatch('cluster/findAll', { type: RBAC.ROLES }),
        clusterRows: this.$store.dispatch('cluster/findAll', { type: RBAC.CLUSTER_ROLES }),
      });

      this.globalRows = hash.globalRows;
      this.clusterRows = hash.clusterRows;
    },
  },
};
</script>

<template>
  <div>
    <Loading ref="loader" />
    <div v-if="loading">
    </div>
    <div v-else>
      <nuxt-child
        :global-rows="globalRows"
        :cluster-rows="clusterRows"
        :tab-list="tabs"
      />
    </div>
  </div>
</template>
