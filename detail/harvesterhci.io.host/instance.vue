<script>
import { STATE, AGE, NAME } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
import Loading from '@/components/Loading';
import VmState from '@/components/formatter/vmState';
import { allHash } from '@/utils/promise';
import { HCI } from '@/config/types';
import { HOSTNAME } from '@/config/labels-annotations';

export default {
  name: 'InstanceNode',

  components: {
    SortableTable,
    Loading,
    VmState,
  },

  props: {
    node: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = await allHash({
      vms:                 this.$store.dispatch('harvester/findAll', { type: HCI.VM }),
      vmis:                this.$store.dispatch('harvester/findAll', { type: HCI.VMI }),
      allNodeNetwork:      this.$store.dispatch('harvester/findAll', { type: HCI.NODE_NETWORK }),
      allClusterNetwork:   this.$store.dispatch('harvester/findAll', { type: HCI.CLUSTER_NETWORK }),
    });
    const instanceMap = {};

    (hash.vmis || []).forEach((vmi) => {
      const vmiUID = vmi?.metadata?.ownerReferences?.[0]?.uid;

      if (vmiUID) {
        instanceMap[vmiUID] = vmi;
      }
    });

    this.allNodeNetwork = hash.allNodeNetwork;
    this.allClusterNetwork = hash.allClusterNetwork;
    this.rows = hash.vms.filter((row) => {
      return instanceMap[row.metadata?.uid]?.status?.nodeName === this.node?.metadata?.labels?.[HOSTNAME];
    });
  },

  data() {
    return {
      rows:              [],
      allNodeNetwork:    [],
      allClusterNetwork: []
    };
  },

  computed: {
    headers() {
      return [
        {
          ...STATE,
          width: 250
        },
        { ...NAME, width: 120 },
        {
          name:      'vmCPU',
          labelKey:  'tableHeaders.cpu',
          sort:      'vmCPU',
          search:    false,
          value:     'spec.template.spec.domain.cpu.cores',
          width:     120
        },
        {
          name:      'vmRAM',
          labelKey:  'glance.memory',
          sort:      'vmRAM',
          search:    false,
          value:     'spec.template.spec.domain.resources.requests.memory',
          width:     120
        },
        {
          name:      'ip',
          label:     'IP Address',
          labelKey:  'harvester.tableHeaders.vm.ipAddress',
          value:     'id',
          formatter: 'ipAddress'
        },
        {
          ...AGE,
          sort: 'metadata.creationTimestamp:desc',
        }
      ];
    },
  },

  methods: {}
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else id="host-instances" class="row">
    <div class="col span-12">
      <SortableTable
        v-bind="$attrs"
        :headers="headers"
        default-sort-by="age"
        :rows="rows"
        key-field="_key"
        v-on="$listeners"
      >
        <template slot="cell:state" slot-scope="scope" class="state-col">
          <div class="state">
            <VmState class="vmstate" :row="scope.row" :all-node-network="allNodeNetwork" :all-cluster-network="allClusterNetwork" />
          </div>
        </template>
      </Sortabletable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#host-instances {
  ::v-deep thead th {
    vertical-align: middle;
  }

  ::v-deep .state {
    display: flex;

    .vmstate {
      margin-right: 6px;
    }
  }
}
</style>
