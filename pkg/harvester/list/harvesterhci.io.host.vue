<script>
import ResourceTable from '@shell/components/ResourceTable';
import Loading from '@shell/components/Loading';
import { STATE, NAME, AGE } from '@shell/config/table-headers';
import {
  METRIC, NODE, SCHEMA, LONGHORN, POD
} from '@shell/config/types';
import { HCI } from '../types';
import { allHash } from '@shell/utils/promise';
import metricPoller from '@shell/mixins/metric-poller';
import CopyToClipboard from '@shell/components/CopyToClipboard';

const schema = {
  id:         HCI.HOST,
  type:       SCHEMA,
  attributes: {
    kind:       HCI.HOST,
    namespaced: true
  },
  metadata: { name: HCI.HOST },
};

export default {
  name: 'HarvesterListHost',

  components: {
    CopyToClipboard,
    ResourceTable,
    Loading,
  },

  mixins: [metricPoller],

  async fetch() {
    const _hash = {
      nodes: this.$store.dispatch('harvester/findAll', { type: NODE }),
      pods:  this.$store.dispatch('harvester/findAll', { type: POD }),
    };

    if (this.$store.getters['harvester/schemaFor'](METRIC.NODE)) {
      _hash.metric = this.$store.dispatch('harvester/findAll', { type: METRIC.NODE });
    } else {
      this.hasMetricSchema = false;
    }

    if (this.$store.getters['harvester/schemaFor'](LONGHORN.NODES)) {
      _hash.longhornNodes = this.$store.dispatch('harvester/findAll', { type: LONGHORN.NODES });
    } else {
      this.hasLonghornSchema = false;
    }

    if (this.$store.getters['harvester/schemaFor'](HCI.BLOCK_DEVICE)) {
      _hash.blockDevices = this.$store.dispatch('harvester/findAll', { type: HCI.BLOCK_DEVICE });
    }

    const hash = await allHash(_hash);

    this.rows = hash.nodes;
  },

  data() {
    return {
      rows:              [],
      hasMetricSchema:   true,
      hasLonghornSchema: true,
    };
  },

  computed: {
    headers() {
      const out = [
        STATE,
        NAME,
        {
          name:     'host-ip',
          labelKey: 'tableHeaders.hostIp',
          search:   ['internalIp'],
          value:    'internalIp',
        },
        {
          name:      'diskState',
          labelKey:  'tableHeaders.diskState',
          value:     'diskState',
          formatter: 'HarvesterDiskState',
          width:     130,
        },
      ];

      if (this.hasMetricSchema) {
        const width = this.hasLonghornSchema ? '230' : '345';
        const metricCol = [
          {
            name:          'cpu',
            labelKey:      'node.detail.glance.consumptionGauge.cpu',
            value:         'id',
            width,
            formatter:     'HarvesterCPUUsed',
            formatterOpts: { showUsed: true },
          },
          {
            name:          'memory',
            labelKey:      'node.detail.glance.consumptionGauge.memory',
            value:         'id',
            width,
            formatter:     'HarvesterMemoryUsed',
            formatterOpts: { showUsed: true },
          },
        ];

        out.splice(-1, 0, ...metricCol);
      }

      if (this.hasLonghornSchema) {
        const storageHeader = {
          name:          'storage',
          labelKey:      'tableHeaders.storage',
          value:         'id',
          width:         '230',
          formatter:     'HarvesterStorageUsed',
          formatterOpts: { showReserved: true },
        };

        out.splice(-1, 0, storageHeader);
      }

      out.push(AGE);

      out.push({
        name:  'console',
        label: ' ',
        align: 'right',
        width: 65,
      });

      return out;
    },

    schema() {
      return schema;
    }
  },
  methods: {
    async loadMetrics() {
      const schema = this.$store.getters['harvester/schemaFor'](METRIC.NODE);

      if (schema) {
        await this.$store.dispatch('harvester/findAll', {
          type: METRIC.NODE,
          opt:  { force: true }
        });

        this.$forceUpdate();
      }
    },

    goto(row) {
      window.open(row.consoleUrl, '_blank');
    }
  },

  typeDisplay() {
    const { params:{ resource: type } } = this.$route;
    let paramSchema = schema;

    if (type !== schema.id) {
      paramSchema = this.$store.getters['harvester/schemaFor'](type);
    }

    return this.$store.getters['type-map/labelFor'](paramSchema, 99);
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTable
      v-bind="$attrs"
      :schema="schema"
      :groupable="false"
      :headers="headers"
      :rows="[...rows]"
      :namespaced="false"
      key-field="_key"
      v-on="$listeners"
    >
      <template slot="cell:host-ip" slot-scope="scope">
        <div class="name-console">
          {{ scope.row.internalIp }}<CopyToClipboard :text="scope.row.internalIp" label-as="tooltip" class="icon-btn" action-color="bg-transparent" />
        </div>
      </template>

      <template #cell:console="{row}">
        <button type="button" class="btn btn-sm role-primary" @click="goto(row)">
          {{ t('harvester.host.console') }}
        </button>
      </template>
    </ResourceTable>
  </div>
</template>
