<script>
import ResourceTable from '@/components/ResourceTable';
import Loading from '@/components/Loading';
import { STATE, NAME, AGE } from '@/config/table-headers';
import { METRIC, NODE, SCHEMA } from '@/config/types';
import { allHash } from '@/utils/promise';
import metricPoller from '@/mixins/metric-poller';
import MaintenanceModal from './maintenanceModal';
import CordonModal from './cordonModal';

const schema = {
  id:         'host',
  type:       SCHEMA,
  attributes: {
    kind:       'host',
    namespaced: true
  },
  metadata: { name: 'host' },
};

const HOST_IP = {
  name:      'host-ip',
  labelKey:  'tableHeaders.hostIp',
  search:    ['internalIp'],
  value:     'internalIp',
  formatter: 'HostIp'
};

export default {
  name:       'ListHost',
  components: {
    ResourceTable, Loading, MaintenanceModal, CordonModal
  },
  mixins: [metricPoller],

  async fetch() {
    const hash = await allHash({
      nodes:      this.$store.dispatch('virtual/findAll', { type: NODE }),
      metric:   this.$store.dispatch('virtual/findAll', { type: METRIC.NODE }),
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
        NAME,
        HOST_IP,
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
      const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

      if (schema) {
        await this.$store.dispatch('virtual/findAll', {
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
      paramSchema = this.$store.getters['cluster/schemaFor'](type);
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
    </ResourceTable>

    <MaintenanceModal />
    <CordonModal />
  </div>
</template>
