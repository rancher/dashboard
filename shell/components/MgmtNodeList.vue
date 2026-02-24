<script>
import { MANAGEMENT } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import {
  INTERNAL_EXTERNAL_IP,
  STATE, NAME as NAME_COL, AGE, MANAGEMENT_NODE_OS
} from '@shell/config/table-headers';

// exclude roles column - it is not necessarily used (or used the same way) outside of Rancher provisioning
export const DEFAULT_HEADERS = [STATE, {
  ...NAME_COL,
  value:         'status.nodeName',
  formatterOpts: { reference: 'kubeNodeDetailLocation' }
}, INTERNAL_EXTERNAL_IP, MANAGEMENT_NODE_OS, AGE];

export default {
  name: 'ClusterScopedManagementNodeList',

  components: { ResourceTable },

  props: {
    resource: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    // override default management node schema headers
    headers: {
      type:    Array,
      default: () => DEFAULT_HEADERS
    },

    // TODO nb type this function
    // function to get node group for a given node, used for grouping nodes by pool in the table
    // result  should be an object with name and (optionally) description properties
    getNodeGroup: {
      type:    Function,
      default: null
    }

  },

  /**
   * //TODO nb management nodes only because norman node actions are going to be deprecated + lets not built feats for Norman if we can avoid it
   * avoid fetching ALL nodes to find this cluster's nodes
   * mgmt nodes do not have labels that can be used with a labelSelector action
   * neither the prov cluster nor mgmt cluster list mgmt nodes in their metadata.relationships nor are the node names listed in either cluster's status
   * BUT mgmt nodes are scoped to a cluster's namespace, so we can fetch only mgmt nodes in the cluster's namespace
   */
  async fetch() {
    if ( this.$store.getters['management/canList'](MANAGEMENT.NODE) ) {
      const hasAllMgmtNodes = this.$store.getters['management/haveAll'](MANAGEMENT.NODE);

      if (hasAllMgmtNodes) {
        this.mgmtNodes = this.$store.getters['management/all'](MANAGEMENT.NODE);
      } else {
        this.mgmtNodes = await this.$store.dispatch('management/findLabelSelector', {
          type:     MANAGEMENT.NODE,
          matching: { namespace: this.resource.mgmtClusterId }
        } );
      }
    }
  },

  data() {
    return {
      mgmtNodes: [],

      mgmtNodeSchema: this.$store.getters[`management/schemaFor`](MANAGEMENT.NODE),

      noneGroupOption: {
        tooltipKey: 'resourceTable.groupBy.none',
        icon:       'icon-list-flat',
        value:      'none',
      },

      poolGroupOption: {
        tooltipKey: 'resourceTable.groupBy.pool',
        icon:       'icon-cluster',
        value:      'poolRef',
        field:      'poolRef.name'
      }

    };
  },

  computed: {
    nodes() {
      return this.mgmtNodes.filter((x) => x.mgmtClusterId === this.resource.mgmtClusterId).map((node) => {
        const poolRef = this.getNodeGroup(node);

        node.poolRef = poolRef;

        return node;
      });
    },
  },
};
</script>

<template>
  <ResourceTable
    v-bind="$attrs"
    :schema="mgmtNodeSchema"
    :headers="headers"
    :rows="nodes"
    group-ref="poolRef"
    :hide-grouping-controls="true"
    :group-options="[noneGroupOption, poolGroupOption]"
  >
    <template #main-row:isFake="{fullColspan}">
      <tr class="main-row">
        <td
          :colspan="fullColspan"
          class="no-entries"
        >
          {{ t('node.list.noNodes') }}
        </td>
      </tr>
    </template>

    <template #group-by="{group}">
      <div
        class="pool-row"
        :class="{'has-description':group.ref}"
      >
        <div
          v-trim-whitespace
          class="group-tab"
        >
          {{ group.ref?.name }}
          <div
            v-if="group.ref"
            v-clean-html="group.ref.description"
            class="description text-muted text-small"
          />
        </div>
      </div>
    </template>
  </ResourceTable>
</template>

<style scoped lang="scss">
.pool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.has-description {
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
  .group-header-buttons {
    align-items: center;
    display: flex;
  }
}
</style>
