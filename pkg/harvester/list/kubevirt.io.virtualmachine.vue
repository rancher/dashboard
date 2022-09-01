<script>
import ConsoleBar from '../components/VMConsoleBar';
import ResourceTable from '@shell/components/ResourceTable';
import LinkDetail from '@shell/components/formatter/LinkDetail';
import HarvesterVmState from '..//formatters/HarvesterVmState';

import { STATE, AGE, NAME, NAMESPACE } from '@shell/config/table-headers';
import { NODE, POD } from '@shell/config/types';
import { HCI } from '../types';

import { allHash } from '@shell/utils/promise';
import Loading from '@shell/components/Loading';

export default {
  name:       'HarvesterListVM',
  components: {
    Loading,
    HarvesterVmState,
    LinkDetail,
    ConsoleBar,
    ResourceTable
  },

  props: {
    schema: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const _hash = {
      vms:               this.$store.dispatch('harvester/findAll', { type: HCI.VM }),
      pod:               this.$store.dispatch('harvester/findAll', { type: POD }),
      restore:           this.$store.dispatch('harvester/findAll', { type: HCI.RESTORE }),
    };

    if (this.$store.getters['harvester/schemaFor'](NODE)) {
      _hash.nodes = this.$store.dispatch('harvester/findAll', { type: NODE });
    }

    if (this.$store.getters['harvester/schemaFor'](HCI.NODE_NETWORK)) {
      _hash.nodeNetworks = this.$store.dispatch('harvester/findAll', { type: HCI.NODE_NETWORK });
    }

    if (this.$store.getters['harvester/schemaFor'](HCI.CLUSTER_NETWORK)) {
      _hash.clusterNetworks = this.$store.dispatch('harvester/findAll', { type: HCI.CLUSTER_NETWORK });
    }

    const hash = await allHash(_hash);

    this.allVMs = hash.vms;
    this.allNodeNetworks = hash.nodeNetworks || [];
    this.allClusterNetworks = hash.clusterNetworks || [];
  },

  data() {
    return {
      allVMs:             [],
      allVMIs:            [],
      allNodeNetworks:    [],
      allClusterNetworks: [],
      HCI
    };
  },

  computed: {
    headers() {
      return [
        STATE,
        {
          ...NAME,
          width: 300,
        },
        NAMESPACE,
        {
          name:        'CPU',
          label:       'CPU',
          sort:        ['spec.template.spec.domain.cpu.cores'],
          value:       'spec.template.spec.domain.cpu.cores',
          align:       'center',
          dashIfEmpty: true,
        },
        {
          name:          'Memory',
          value:         'displayMemory',
          sort:          ['memorySort'],
          align:         'center',
          labelKey:      'tableHeaders.memory',
          formatter:     'Si',
          formatterOpts: {
            opts: {
              increment: 1024, addSuffix: true, maxExponent: 3, minExponent: 3, suffix: 'i',
            },
            needParseSi: true
          },
        },
        {
          name:      'ip',
          label:     'IP Address',
          value:     'id',
          formatter: 'HarvesterIpAddress',
          labelKey:  'tableHeaders.ipAddress'
        },
        {
          name:      'node',
          label:     'Node',
          value:     'id',
          sort:      ['realAttachNodeName'],
          formatter: 'HarvesterNodeName',
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

  async created() {
    const vmis = await this.$store.dispatch('harvester/findAll', { type: HCI.VMI });

    await this.$store.dispatch('harvester/findAll', { type: HCI.VMIM });

    this.$set(this, 'allVMIs', vmis);
  }
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
          <HarvesterVmState class="vmstate" :row="scope.row" :all-node-network="allNodeNetworks" :all-cluster-network="allClusterNetworks" />
        </div>
      </template>

      <template slot="cell:name" slot-scope="scope">
        <div class="name-console">
          <LinkDetail v-if="scope.row.type !== HCI.VMI" v-model="scope.row.metadata.name" :row="scope.row" />
          <span v-else>
            {{ scope.row.metadata.name }}
          </span>

          <ConsoleBar :resource="scope.row" class="console mr-10" />
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

.name-console {
  display: flex;
  align-items: center;
  justify-content: space-around;

  span {
    line-height: 26px;
    width:160px;
    overflow:hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    -o-text-overflow:ellipsis;
  }

  display: flex;
  justify-content: space-around;
}
</style>
