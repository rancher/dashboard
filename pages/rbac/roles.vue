<script>

import { RBAC } from '@/config/types';
import LoadDeps from '@/mixins/load-deps';
import { allHash } from '@/utils/promise';
import Loading from '@/components/Loading';

/* route in this case is the nested route under rbac/roles/<global/cluster> */
const Tabs = [
  {
    label:     'Roles',
    name:      'role',
    route:     { name: 'rbac-roles' },
  },
  {
    label:     'Cluster Roles',
    name:      'cluster',
    route:     { name: 'rbac-roles-cluster' },
  },
];

/**
 * Parent container for Roles/ClusterRole role resources
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
     * Returns roles and cluster roles rows ( ansync )
     */
    async loadDeps() {
      const hash = await allHash({
        roleRows:    this.$store.dispatch('cluster/findAll', { type: RBAC.ROLES }),
        clusterRows: this.$store.dispatch('cluster/findAll', { type: RBAC.CLUSTER_ROLES }),
      });

      this.roleRows = hash.roleRows;
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
        :role-rows="roleRows"
        :cluster-rows="clusterRows"
        :tab-list="tabs"
      />
    </div>
  </div>
</template>
