<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import {
  STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM
} from '@/config/table-headers';
import metricPoller from '@/mixins/metric-poller';

import { CAPI, MANAGEMENT, METRIC, NODE } from '@/config/types';
import { mapGetters } from 'vuex';
import { allHash } from '@/utils/promise';
import { addParam } from '@/utils/url';
import { get } from '@/utils/object';

export default {
  name:       'ListNode',
  components: { Loading, ResourceTable },
  mixins:     [metricPoller],

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = await allHash({
      nodes:        this.$store.dispatch('cluster/findAll', { type: NODE }),
      nodePools:    this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL }),
    });

    this.nodes = hash.nodes;

    this.allNodePools = hash.nodePools;

    const hasPools = this.allNodePools.filter(pool => pool?.spec?.clusterName === this.currentCluster.id).length;

    if (hasPools) {
      await this.loadRancherNodes();

      this.nodes.forEach((node) => {
        let nodePoolId = this.rancherNodes[node.id]?.nodePoolId;

        nodePoolId = nodePoolId.split(':')[1];
        node.nodePoolId = nodePoolId;
        this.nodePools[nodePoolId]._nodes.push(node);
      });
    }

    if ( this.$store.getters['management/schemaFor'](CAPI.MACHINE) ) {
      await this.$store.dispatch('management/findAll', { type: CAPI.MACHINE });
    }
  },

  data() {
    return {
      nodes:           null,
      allNodePools:    null,
      rancherNodes: null,
      headers:         [STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM],
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    nodePools() {
      const clusterName = this.currentCluster.id;

      if (!this.allNodePools) {
        return;
      }

      return this.allNodePools.reduce((map, pool) => {
        if (pool?.spec?.clusterName !== clusterName) {
          return map;
        }
        map[pool.name] = pool;
        pool._nodes = [];

        return map;
      }, {});
    },

    hasPools() {
      return !!Object.keys(this.nodePools).length;
    }
  },

  watch: {
    nodes: {
      deep:    true,
      handler: async(neu, old) => {
        if ((!old || neu.length !== old.length) && this.hasPools) {
          await this.loadRancherNodes();

          neu.forEach((node) => {
            let nodePoolId = this.rancherNodes[node.id]?.nodePoolId;

            nodePoolId = nodePoolId.split(':')[1];
            node.nodePoolId = nodePoolId;
            this.nodePools[nodePoolId]._nodes.push(node);
          });
        }
      }

    },
  },

  methods:  {
    async loadMetrics() {
      const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

      if (schema) {
        await this.$store.dispatch('cluster/findAll', {
          type: METRIC.NODE,
          opt:  { force: true }
        });

        this.$forceUpdate();
      }
    },

    async loadRancherNodes() {
      let nodeUrl = '/v3/nodes';

      nodeUrl = addParam(nodeUrl, 'clusterId', this.currentCluster.id);
      const res = await this.$store.dispatch('rancher/findAll', { type: NODE, opt: { load: false, url: nodeUrl } });

      this.rancherNodes = res.data.reduce((map, node) => {
        map[node.nodeName] = node;

        return map;
      }, {});
    },

    poolForTableGroup(group) {
      const id = group.rows[0].nodePoolId;

      if (!id) {
        return {};
      }

      return this.nodePools[id];
    },

    scalePool(pool, amt = 0) {
      pool.spec.quantity += amt;
      pool.save();
    },

    get
  }

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else-if="hasPools"
    v-bind="$attrs"
    :schema="schema"
    :headers="headers"
    :rows="[...nodes]"
    key-field="_key"
    :groupable="true"
    :always-group="true"
    group-by="nodePoolId"
    group-tooltip="resourceTable.groupBy.project"
    v-on="$listeners"
  >
    <template #group-by="{group}">
      <div v-if="poolForTableGroup(group)" class="pool-row">
        <span> {{ get(poolForTableGroup(group), 'spec.hostnamePrefix') }}</span>
        <span class="pull-right">
          <button :disabled="get(poolForTableGroup(group), 'spec.quantity') < 2" type="button" class="btn btn-sm role-secondary" @click="scalePool(poolForTableGroup(group), -1)">
            <i class="icon icon-sm icon-minus" />
          </button>
          <button type="button" class="btn btn-sm role-secondary" @click="scalePool(poolForTableGroup(group), 1)">
            <i class="icon icon-sm icon-plus" />
          </button>
        </span>
      </div>
    </template>
  </ResourceTable>

  <ResourceTable
    v-else
    v-bind="$attrs"
    :schema="schema"
    :headers="headers"
    :rows="[...nodes]"
    key-field="_key"
    group-tooltip="resourceTable.groupBy.project"
    v-on="$listeners"
  />
</template>

<style lang='scss' scoped>
.pool-row{
  padding: 0px 10px;
   BUTTON {
     line-height: 1em;
  }
}
</style>
