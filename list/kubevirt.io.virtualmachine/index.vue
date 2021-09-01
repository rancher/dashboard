<script>
import VmState from '@/components/formatter/vmState';
import ResourceTable from '@/components/ResourceTable';

import { STATE, AGE, NAME, NAMESPACE } from '@/config/table-headers';
import { HCI, NODE } from '@/config/types';

import { allHash } from '@/utils/promise';
import Loading from '@/components/Loading';

export default {
  name:       'ListVM',
  components: {
    Loading,
    VmState,
    ResourceTable
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = await allHash({
      nodes:             this.$store.dispatch('virtual/findAll', { type: NODE }),
      vms:               this.$store.dispatch('virtual/findAll', { type: HCI.VM }),
      vmis:              this.$store.dispatch('virtual/findAll', { type: HCI.VMI }),
      nodeNetworks:      this.$store.dispatch('virtual/findAll', { type: HCI.NODE_NETWORK }),
      clusterNetworks:   this.$store.dispatch('virtual/findAll', { type: HCI.CLUSTER_NETWORK }),
      restore:           this.$store.dispatch('virtual/findAll', { type: HCI.RESTORE }),
    });

    this.allVMs = hash.vms;
    this.allVMIs = hash.vmis;
    this.allNodeNetworks = hash.nodeNetworks;
    this.allClusterNetworks = hash.clusterNetworks;
  },

  data() {
    return {
      allVMs:             [],
      allVMIs:            [],
      allNodeNetworks:    [],
      allClusterNetworks: []
    };
  },

  computed: {
    headers() {
      return [
        STATE,
        {
          ...NAME,
          width:         300,
          formatter:     'vmName',
        },
        NAMESPACE,
        {
          name:      'CPU',
          label:     'CPU',
          sort:      ['spec.template.spec.domain.cpu.cores'],
          value:     'spec.template.spec.domain.cpu.cores',
          align:     'center'
        },
        {
          name:      'Memory',
          value:     'spec.template.spec.domain.resources.requests.memory',
          sort:      ['memorySort'],
          align:     'center',
          labelKey:  'tableHeaders.memory'
        },
        {
          name:      'ip',
          label:     'IP Address',
          value:     'id',
          formatter: 'ipAddress',
          labelKey:  'tableHeaders.ipAddress'
        },
        {
          name:      'node',
          label:     'Node',
          value:     'id',
          sort:      ['nameSort'],
          formatter: 'nodeName',
          labelKey:  'tableHeaders.node'
        },
        {
          ...AGE,
          sort: 'metadata.creationTimestamp:desc',
        }
      ];
    },

    rows() {
      const matchVMIs = this.allVMIs.filter(VMI => !this.allVMs.find(VM => VM.id === VMI.id));

      return [...this.allVMs, ...matchVMIs];
    }
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTable
      v-bind="$attrs"
      :headers="headers"
      default-sort-by="age"
      :rows="rows"
      :schema="schema"
      :groupable="true"
      key-field="_key"
      v-on="$listeners"
    >
      <template slot="cell:state" slot-scope="scope" class="state-col">
        <div class="state">
          <VmState class="vmstate" :row="scope.row" :all-node-network="allNodeNetworks" :all-cluster-network="allClusterNetworks" />
        </div>
      </template>
    </ResourceTable>
  </div>
</template>

<style lang="scss" scoped>
.state {
  display: flex;

  .vmstate {
    margin-right: 6px;
  }
}
</style>
