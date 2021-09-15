<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { STATE, NAME, AGE } from '@/config/table-headers';
import { METRIC, NODE, SCHEMA, HCI } from '@/config/types';
import { allHash } from '@/utils/promise';
import metricPoller from '@/mixins/metric-poller';
import CopyToClipboard from '@/components/CopyToClipboard';

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
  name:       'HarvesterListHost',
  components: {
    CopyToClipboard, ResourceTable, Loading
  },
  mixins: [metricPoller],

  async fetch() {
    const hash = await allHash({
      nodes:      this.$store.dispatch('harvester/findAll', { type: NODE }),
      metric:   this.$store.dispatch('harvester/findAll', { type: METRIC.NODE }),
    });

    this.rows = hash.nodes;
  },

  data() {
    return { rows: [] };
  },

  computed: {
    headers() {
      return [
        STATE,
        {
          ...NAME,
          width:         300,
          formatter:     'hostName',
        },
        {
          name:      'host-ip',
          labelKey:  'tableHeaders.hostIp',
          search:    ['internalIp'],
          value:     'internalIp',
        },
        {
          name:          'cpu',
          labelKey:      'node.detail.glance.consumptionGauge.cpu',
          value:         'id',
          width:         230,
          formatter:     'CPUUsed',
        },
        {
          name:          'memory',
          labelKey:      'node.detail.glance.consumptionGauge.memory',
          value:         'id',
          width:         230,
          formatter:     'MemoryUsed',
        },
        {
          name:          'storage',
          labelKey:      'tableHeaders.storage',
          value:         'id',
          width:         230,
          formatter:     'StorageUsed',
        },
        AGE,
      ];
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
    </ResourceTable>
  </div>
</template>
