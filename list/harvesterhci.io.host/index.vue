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
    const _hash = { nodes: this.$store.dispatch('harvester/findAll', { type: NODE }) };

    if (this.$store.getters['harvester/schemaFor'](METRIC.NODE)) {
      _hash.metric = this.$store.dispatch('harvester/findAll', { type: METRIC.NODE });
    } else {
      this.hasMetricSchema = false;
    }
    const hash = await allHash(_hash);

    this.rows = hash.nodes;
  },

  data() {
    return {
      rows:            [],
      hasMetricSchema: true
    };
  },

  computed: {
    headers() {
      const out = [
        STATE,
        {
          ...NAME,
          width:         300,
          formatter:     'HarvesterHostName',
        },
        {
          name:      'host-ip',
          labelKey:  'tableHeaders.hostIp',
          search:    ['internalIp'],
          value:     'internalIp',
        },
        AGE,
      ];

      if (this.hasMetricSchema) {
        const metricCol = [
          {
            name:          'cpu',
            labelKey:      'node.detail.glance.consumptionGauge.cpu',
            value:         'id',
            width:         '230',
            formatter:     'HarvesterCPUUsed',
          },
          {
            name:          'memory',
            labelKey:      'node.detail.glance.consumptionGauge.memory',
            value:         'id',
            width:         '230',
            formatter:     'HarvesterMemoryUsed'
          },
          {
            name:          'storage',
            labelKey:      'tableHeaders.storage',
            value:         'id',
            width:         '230',
            formatter:     'HarvesterStorageUsed',
          }
        ];

        out.splice(-1, 0, ...metricCol);
      }

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
