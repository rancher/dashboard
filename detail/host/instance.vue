<script>
import { STATE, AGE, NAME } from '@/config/table-headers';
import SortableTable from '@/components/SortableTable';
// import VmState from '@/components/formatter/BadgeStateFormatter';
import VmState from '@/components/formatter/vmState';
import { allHash } from '@/utils/promise';
import { HCI } from '@/config/types';
import BackupModal from '@/list/kubevirt.io.virtualmachine/backupModal';
import RestoreModal from '@/list/kubevirt.io.virtualmachine/restoreModal';
import MigrationModal from '@/list/kubevirt.io.virtualmachine/MigrationModal';
import CloneTemplate from '@/list/kubevirt.io.virtualmachine/cloneTemplate';

export default {
  name: 'InstanceNode',

  components: {
    SortableTable,
    VmState,
    BackupModal,
    RestoreModal,
    MigrationModal,
    CloneTemplate
  },

  props: {
    rows: {
      type:     Array,
      required: true,
    },
  },

  async fetch() {
    const hash = await allHash({
      allNodeNetwork:      this.$store.dispatch('virtual/findAll', { type: HCI.NODE_NETWORK }),
      allClusterNetwork:   this.$store.dispatch('virtual/findAll', { type: HCI.CLUSTER_NETWORK }),
    });

    this.allNodeNetwork = hash.allNodeNetwork;
    this.allClusterNetwork = hash.allClusterNetwork;
  },

  data() {
    return {
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
  <div class="row host-instances">
    <div class="col span-12">
      <SortableTable
        v-bind="$attrs"
        :headers="headers"
        default-sort-by="age"
        :rows="[...rows]"
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

    <BackupModal />
    <RestoreModal />
    <MigrationModal />
    <CloneTemplate />
  </div>
</template>

<style lang="scss">
.bordered-table .host-instances thead th {
  vertical-align: middle;
}

.bordered-table .host-instances .state {
  display: flex;

  .vmstate {
    margin-right: 6px;
  }
}
</style>
