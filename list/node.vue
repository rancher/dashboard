<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import {
  STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM, PODS, AGE
} from '@/config/table-headers';
import metricPoller from '@/mixins/metric-poller';

import { MANAGEMENT, METRIC, NODE, POD } from '@/config/types';
import { mapGetters } from 'vuex';
import { allHash } from '@/utils/promise';
import { get } from '@/utils/object';
import { GROUP_RESOURCES, mapPref } from '@/store/prefs';
import { COLUMN_BREAKPOINTS } from '@/components/SortableTable/index.vue';

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
      kubeNodes:     this.$store.dispatch('cluster/findAll', { type: NODE }),
      steveNodes:    this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE }),
      nodePools:     this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL }),
      nodeTemplates: this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE }),
      // Used for running pods metrics
      pods:          this.$store.dispatch('cluster/findAll', { type: POD })
    });

    this.kubeNodes = hash.kubeNodes;
    this.nodePools = hash.nodePools;
    this.nodeTemplates = hash.nodeTemplates;
    this.steveNodes = hash.steveNodes.filter(n => n.id.startsWith(this.currentCluster.id));

    await this.updateNodePools(hash.kubeNodes);
  },

  data() {
    return {
      kubeNodes:     null,
      steveNodes:    null,
      nodeTemplates: null,
      nodePools:     null,
      headers:          [STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, {
        ...CPU,
        breakpoint: COLUMN_BREAKPOINTS.LAPTOP
      }, {
        ...RAM,
        breakpoint: COLUMN_BREAKPOINTS.LAPTOP
      }, {
        ...PODS,
        breakpoint: COLUMN_BREAKPOINTS.DESKTOP
      }, AGE],
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    tableGroup: mapPref(GROUP_RESOURCES),

    clusterNodePools() {
      return this.nodePools.filter(pool => pool?.spec?.clusterName === this.currentCluster.id);
    },

    clusterNodePoolsMap() {
      return this.clusterNodePools.reduce((res, node) => {
        res[node.id] = node;

        return res;
      }, {});
    },

    clusterSteveNodes() {
      return this.steveNodes.filter(n => n.id.startsWith(this.currentCluster.id));
    },

    hasPools() {
      return !!this.clusterNodePools.length;
    },

  },

  watch: {
    kubeNodes: {
      deep: true,
      handler(neu, old) {
        this.updateNodePools(neu);
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

    updateNodePools(nodes = this.kubeNodes) {
      nodes.forEach((node) => {
        const sNode = this.steveNodes.find(sn => sn.status.nodeName === node.id);

        if (sNode) {
          node.nodePoolId = sNode.spec.nodePoolName?.replace(':', '/') || '' ;
        }
      });
    },

    getNodePoolFromTableGroup(group) {
      return this.getNodePool(group.key);
    },

    getNodeTemplate(nodeTemplateName) {
      const parsedName = nodeTemplateName.replace(':', '/');

      return this.nodeTemplates.find(nt => nt.id === parsedName);
    },

    get,

  }

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <ResourceTable
    v-else
    v-bind="$attrs"
    :schema="schema"
    :headers="headers"
    :rows="[...kubeNodes]"
    :groupable="hasPools"
    :group-by="tableGroup === 'none' ? '' : 'nodePoolId'"
    group-tooltip="node.list.pool"
    v-on="$listeners"
  >
    <template #group-by="{group}">
      <div class="pool-row" :class="{'has-description':clusterNodePoolsMap[group.key] && clusterNodePoolsMap[group.key].nodeTemplate}">
        <div v-trim-whitespace class="group-tab">
          <div v-if="clusterNodePoolsMap[group.key]" class="project-name">
            {{ t('node.list.pool') }}: {{ clusterNodePoolsMap[group.key].spec.hostnamePrefix }} ({{ group.rows.length }})
          </div>
          <div v-else class="project-name">
            {{ t('node.list.pool') }}: {{ t('generic.none') }}
          </div>
          <div v-if="clusterNodePoolsMap[group.key] && clusterNodePoolsMap[group.key].nodeTemplate" class="description text-muted text-small">
            {{ clusterNodePoolsMap[group.key].providerDisplay }} &ndash;  {{ clusterNodePoolsMap[group.key].providerLocation }} / {{ clusterNodePoolsMap[group.key].providerSize }} ({{ clusterNodePoolsMap[group.key].providerName }})
          </div>
        </div>
      </div>
    </template>
  </ResourceTable>
</template>

<style lang='scss' scoped>
.pool-row{
  display: flex;
  justify-content: space-between;

  .project-name {
    line-height: 30px;
  }

  &.has-description {
    .right {
      margin-top: 5px;
    }
    .group-tab {
      &, &::after {
          height: 50px;
      }

      &::after {
          right: -20px;
      }

      .description {
          margin-top: -20px;
      }
    }
  }

  BUTTON {
     line-height: 1em;
  }
}

</style>
