<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Poller from '@/utils/poller';
import { METRIC, NODE, HCI } from '@/config/types';
import { HOSTNAME } from '@/config/labels-annotations';
import { allHash } from '@/utils/promise';
import Basic from './basic';
import Instance from './instance';
// import Monitor from './monitor';

const METRICS_POLL_RATE_MS = 30000;
const MAX_FAILURES = 2;

export default {
  name: 'DetailNode',

  components: {
    Tabbed,
    Tab,
    Basic,
    Instance,
    // Monitor
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const hash = {
      nodes:        this.$store.dispatch('cluster/findAll', { type: NODE }),
      vms:          this.$store.dispatch('cluster/findAll', { type: HCI.VM }),
      hostNetworks: this.$store.dispatch('cluster/findAll', { type: HCI.NODE_NETWORK })
    };

    const res = await allHash(hash);
    const instanceMap = {};

    (this.$store.getters['cluster/all'](HCI.VMI) || []).forEach((vmi) => {
      const vmiUID = vmi?.metadata?.ownerReferences?.[0]?.uid;

      if (vmiUID) {
        instanceMap[vmiUID] = vmi;
      }
    });

    this.rows = res.vms.filter((row) => {
      return instanceMap[row.metadata?.uid]?.status?.nodeName === this.value?.metadata?.labels?.[HOSTNAME];
    });

    const hostNetowrkResource = res.hostNetworks.find( O => this.value.id === O.attachNodeName);

    if (hostNetowrkResource) {
      this.hostNetowrkResource = hostNetowrkResource;
    }
  },

  data() {
    return {
      metricPoller:        new Poller(this.loadMetrics, METRICS_POLL_RATE_MS, MAX_FAILURES),
      metrics:             null,
      mode:                'view',
      rows:                [],
      hostNetowrkResource: null
    };
  },

  mounted() {
    this.metricPoller.start();
  },

  beforeDestroy() {
    this.metricPoller.stop();
  },

  methods: {
    mapToStatus(isOk) {
      return isOk ? 'success' : 'error';
    },

    async loadMetrics() {
      const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

      if (schema) {
        this.metrics = await this.$store.dispatch('cluster/find', {
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
  <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
    <Tab name="basics" :label="t('harvester.vmPage.detail.tabs.basics')" :weight="3" class="bordered-table">
      <Basic v-model="value" :metrics="metrics" :mode="mode" :host-netowrk-resource="hostNetowrkResource" />
    </Tab>
    <Tab name="instance" :label="t('harvester.vmPage.detail.tabs.instance')" :weight="2" class="bordered-table">
      <Instance :rows="rows" />
    </Tab>
    <!-- <Tab name="monitor" :label="t('harvester.vmPage.detail.tabs.monitor')" :weight="1" class="bordered-table">
      <Monitor v-model="value" />
    </Tab> -->
  </Tabbed>
</template>
