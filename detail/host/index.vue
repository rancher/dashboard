<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import metricPoller from '@/mixins/metric-poller';
import { METRIC, NODE, HCI } from '@/config/types';
import { HOSTNAME } from '@/config/labels-annotations';
import { allHash } from '@/utils/promise';
import MaintenanceModal from '@/list/host/maintenanceModal';
import CordonModal from '@/list/host/cordonModal';
import Basic from './basic';
import Instance from './instance';

export default {
  name: 'DetailHost',

  components: {
    Tabbed,
    Tab,
    Basic,
    Instance,
    MaintenanceModal,
    CordonModal
  },
  mixins: [metricPoller],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = {
      nodes:        this.$store.dispatch('virtual/findAll', { type: NODE }),
      vms:          this.$store.dispatch('virtual/findAll', { type: HCI.VM }),
      hostNetworks: this.$store.dispatch('virtual/findAll', { type: HCI.NODE_NETWORK }),
    };

    const res = await allHash(hash);
    const instanceMap = {};

    (this.$store.getters['virtual/all'](HCI.VMI) || []).forEach((vmi) => {
      const vmiUID = vmi?.metadata?.ownerReferences?.[0]?.uid;

      if (vmiUID) {
        instanceMap[vmiUID] = vmi;
      }
    });

    this.rows = res.vms.filter((row) => {
      return instanceMap[row.metadata?.uid]?.status?.nodeName === this.value?.metadata?.labels?.[HOSTNAME];
    });

    const hostNetowrkResource = res.hostNetworks.find( O => this.value.id === O.attachNodeName);

    this.loadMetrics();

    if (hostNetowrkResource) {
      this.hostNetowrkResource = hostNetowrkResource;
    }
  },

  data() {
    return {
      metrics:             null,
      mode:                'view',
      rows:                [],
      hostNetowrkResource: null
    };
  },

  methods: {
    async loadMetrics() {
      const schema = this.$store.getters['virtual/schemaFor'](METRIC.NODE);

      if (schema) {
        this.metrics = await this.$store.dispatch('virtual/find', {
          type: METRIC.NODE,
          id:   this.value.id,
          opt:  { force: true, watch: false }
        });

        this.$forceUpdate();
      }
    },

  }
};
</script>

<template>
  <div>
    <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
      <Tab name="basics" :label="t('harvester.host.tabs.basics')" :weight="3" class="bordered-table">
        <Basic v-model="value" :metrics="metrics" :mode="mode" :host-netowrk-resource="hostNetowrkResource" />
      </Tab>
      <Tab name="instance" :label="t('harvester.host.tabs.instance')" :weight="2" class="bordered-table">
        <Instance :rows="rows" />
      </Tab>
    </Tabbed>

    <MaintenanceModal />
    <CordonModal />
  </div>
</template>
