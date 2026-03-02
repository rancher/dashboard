<script>
import Loading from '@shell/components/Loading.vue';
import MgmtNodeList from '@shell/components/MgmtNodeList.vue';

export default {
  name: 'NodePoolDetailTab',

  props: {
    resource: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },

  async fetch() {
    await this.resource.waitForMgmt();
  },

  components: { MgmtNodeList, Loading },

  methods: {
    getNodeGroup(node) {
      const poolName = node?.status?.nodeLabels?.['eks.amazonaws.com/nodegroup'] || '';

      const poolSpec = (this.resource?.mgmt?.spec?.eksConfig?.nodeGroups || []).find((pool) => pool.nodegroupName === poolName);
      const description = poolSpec ? `${ node?.status?.nodeLabels?.['topology.kubernetes.io/region'] } &ndash; ${ poolSpec?.instanceType }` : '';

      return poolSpec ? { name: poolSpec.nodegroupName, description } : null;
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <MgmtNodeList
    v-else
    :resource="resource"
    v-bind="$attrs"
    :get-node-group="getNodeGroup"
  />
</template>
