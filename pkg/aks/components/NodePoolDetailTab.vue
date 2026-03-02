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
      // the annotation 'agentpool' refers to the pool name that users set. The default value of the first pool's name is also 'agentpool'
      const poolName = node?.status?.nodeLabels?.['kubernetes.azure.com/agentpool'] || '';

      const poolSpec = (this.resource?.mgmt.spec?.aksConfig?.nodePools || []).find((pool) => pool.name === poolName);
      const description = poolSpec ? `${ poolSpec?.mode } &ndash; ${ node?.status?.nodeLabels?.['topology.kubernetes.io/region'] } &ndash; ${ poolSpec?.vmSize }` : '';

      return poolSpec ? { name: poolSpec.name, description } : null;
    },
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
