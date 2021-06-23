<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import Tag from '@/components/Tag';
import {
  STATE, NAME, ROLES, VERSION, INTERNAL_EXTERNAL_IP, CPU, RAM, PODS, AGE
} from '@/config/table-headers';
import metricPoller from '@/mixins/metric-poller';

import {
  CAPI,
  MANAGEMENT, METRIC, NODE, NORMAN, POD
} from '@/config/types';
import { mapGetters } from 'vuex';
import { allHash } from '@/utils/promise';
import { get } from '@/utils/object';
import { GROUP_RESOURCES, mapPref } from '@/store/prefs';
import { COLUMN_BREAKPOINTS } from '@/components/SortableTable/index.vue';

export default {
  name:       'ListNode',
  components: {
    Loading, ResourceTable, Tag
  },
  mixins: [metricPoller],

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = {
      kubeNodes: this.$store.dispatch('cluster/findAll', { type: NODE }),
      // Used by kube node model to determine if SSH action
      machines:           this.$store.dispatch('management/findAll', { type: CAPI.MACHINE })
    };

    const canViewNodePools = this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE_POOL);
    const canViewNodeTemplates = this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE_TEMPLATE);
    const canViewPods = this.$store.getters[`cluster/schemaFor`](POD);

    const canViewNormanNodes = this.$store.getters[`rancher/schemaFor`](NORMAN.NODE);

    if (canViewNormanNodes) {
      // Required for Drain action
      hash.normanNodes = this.$store.dispatch('rancher/findAll', { type: NORMAN.NODE });
    }

    if (canViewNodePools && canViewNodeTemplates) {
      // Managemnet Node's required for kube role and some reousrce states
      hash.mNodes = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE });
      hash.nodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
      hash.nodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    if (canViewPods) {
      // Used for running pods metrics
      hash.pods = this.$store.dispatch('cluster/findAll', { type: POD });
    }

    const res = await allHash(hash);

    this.kubeNodes = res.kubeNodes;
    this.nodePools = res.nodePools || [];
    this.nodeTemplates = res.nodeTemplates || [];

    await this.updateNodePools(res.kubeNodes);
  },

  data() {
    return {
      kubeNodes:     null,
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
      return this.nodePools?.filter(pool => pool?.spec?.clusterName === this.currentCluster.id) || [];
    },

    clusterNodePoolsMap() {
      return this.clusterNodePools.reduce((res, node) => {
        res[node.id] = node;

        return res;
      }, {});
    },

    hasPools() {
      return !!this.clusterNodePools.length;
    },

    groupBy() {
      if (!this.hasPools) {
        return null;
      }

      return this.tableGroup === 'none' ? '' : 'nodePoolId';
    }

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

    updateNodePools(nodes = []) {
      nodes.forEach((node) => {
        // const sNode = this.clustermNodes.find(sn => sn.status.nodeName === node.id);
        const sNode = node.managementNode;

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
    :group-by="groupBy"
    group-tooltip="node.list.pool"
    :sub-rows="true"
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

    <template #sub-row="{fullColspan, row}">
      <tr class="taints sub-row" :class="{'empty-taints': !row.spec.taints || !row.spec.taints.length}">
        <template v-if="row.spec.taints && row.spec.taints.length">
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td :colspan="fullColspan-2">
            <div class="taints">
              {{ t('node.list.nodeTaint') }}:
              <Tag v-for="taint in row.spec.taints" :key="taint.key + taint.value + taint.effect">
                {{ taint.key }}={{ taint.value }}:{{ taint.effect }}
              </Tag>
            </div>
          </td>
        </template>
      </tr>
    </template>
  </ResourceTable>
</template>

<style lang='scss' scoped>
.pool-row {
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

.taints {
  td {
    padding-top:0;
  }
  &.empty-taints {
   td {
      padding: 0;
    }
  }
}

</style>
