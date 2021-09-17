<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import metricPoller from '@/mixins/metric-poller';
import { METRIC, NODE, HCI, LONGHORN } from '@/config/types';
import { allHash } from '@/utils/promise';
import { formatSi } from '@/utils/units';
import ArrayListGrouped from '@/components/form/ArrayListGrouped';
import { findBy } from '@/utils/array';
import { clone } from '@/utils/object';
import Basic from './HarvesterHostBasic';
import Instance from './VirtualMachineInstance';
import Disk from './HarvesterHostDisk';

export default {
  name: 'DetailHost',

  components: {
    Tabbed,
    Tab,
    Basic,
    Instance,
    ArrayListGrouped,
    Disk,
  },
  mixins: [metricPoller],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = {
      nodes:         this.$store.dispatch('harvester/findAll', { type: NODE }),
      hostNetworks:  this.$store.dispatch('harvester/findAll', { type: HCI.NODE_NETWORK }),
      longhornNodes: this.$store.dispatch(`${ inStore }/findAll`, { type: LONGHORN.NODES }),
      blockDevices:   this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.BLOCK_DEVICE }),
    };

    const res = await allHash(hash);
    const hostNetworkResource = res.hostNetworks.find( O => this.value.id === O.attachNodeName);

    this.loadMetrics();

    if (hostNetworkResource) {
      this.hostNetworkResource = hostNetworkResource;
    }

    const blockDevices = this.$store.getters[`${ inStore }/all`](HCI.BLOCK_DEVICE);
    const provisionedBlockDevices = blockDevices.filter((d) => {
      const provisioned = d?.spec?.fileSystem?.provisioned;
      const isCurrentNode = d?.spec?.nodeName === this.value.id;
      const isLonghornMounted = findBy(this.longhornDisks, 'name', d.metadata.name);

      return provisioned && isCurrentNode && !isLonghornMounted;
    })
      .map((d) => {
        return {
          isNew:       true,
          name:        d?.metadata?.name,
          originPath:  d?.spec?.fileSystem?.mountPoint,
          path:        d?.spec?.fileSystem?.mountPoint,
          blockDevice: d,
          displayName: d?.spec?.devPath,
        };
      });

    const disks = [...this.longhornDisks, ...provisionedBlockDevices];

    this.disks = disks;
    this.newDisks = clone(disks);
  },

  data() {
    return {
      metrics:             null,
      mode:                'view',
      hostNetworkResource: null,
      newDisks:            [],
      disks:               [],
    };
  },

  computed: {
    longhornDisks() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNode = this.$store.getters[`${ inStore }/byId`](LONGHORN.NODES, `longhorn-system/${ this.value.id }`);
      const diskStatus = longhornNode?.status?.diskStatus || {};
      const diskSpec = longhornNode.spec?.disks || {};

      const formatOptions = {
        increment:    1024,
        minExponent:  3,
        maxExponent:  3,
        maxPrecision: 2,
        suffix:       'iB',
      };

      const longhornDisks = Object.keys(diskStatus).map((key) => {
        const blockDevice = this.$store.getters[`${ inStore }/byId`](HCI.BLOCK_DEVICE, `longhorn-system/${ key }`);

        return {
          ...diskStatus[key],
          ...diskSpec?.[key],
          name:             key,
          isNew:            false,
          storageReserved:  formatSi(diskSpec[key]?.storageReserved, formatOptions),
          storageAvailable: formatSi(diskStatus[key]?.storageAvailable, formatOptions),
          storageMaximum:   formatSi(diskStatus[key]?.storageMaximum, formatOptions),
          storageScheduled: formatSi(diskStatus[key]?.storageScheduled, formatOptions),
          blockDevice,
          displayName:      blockDevice?.spec?.devPath || key,
        };
      });

      return longhornDisks;
    },
  },

  methods: {
    async loadMetrics() {
      const schema = this.$store.getters['harvester/schemaFor'](METRIC.NODE);

      if (schema) {
        this.metrics = await this.$store.dispatch('harvester/find', {
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
        <Basic v-model="value" :metrics="metrics" :mode="mode" :host-netowrk-resource="hostNetworkResource" />
      </Tab>
      <Tab name="instance" :label="t('harvester.host.tabs.instance')" :weight="2" class="bordered-table">
        <Instance :node="value" />
      </Tab>
      <Tab
        name="disk"
        :weight="1"
        :label="t('harvester.host.tabs.disk')"
      >
        <ArrayListGrouped
          v-model="newDisks"
          :mode="mode"
          :can-remove="false"
        >
          <template #default="props">
            <Disk
              v-model="props.row.value"
              class="mb-20"
              :mode="mode"
              :disks="disks"
            />
          </template>
        </ArrayListGrouped>
      </Tab>
    </Tabbed>
  </div>
</template>
