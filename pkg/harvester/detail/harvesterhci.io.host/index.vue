<script>
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import InfoBox from '@shell/components/InfoBox';
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';

import metricPoller from '@shell/mixins/metric-poller';
import { METRIC, NODE, LONGHORN, POD } from '@shell/config/types';
import { HCI } from '../../types';
import { allHash } from '@shell/utils/promise';
import { formatSi } from '@shell/utils/units';
import { findBy } from '@shell/utils/array';
import { clone } from '@shell/utils/object';

import Basic from './HarvesterHostBasic';
import Instance from './VirtualMachineInstance';
import Disk from './HarvesterHostDisk';
import VlanStatus from './VlanStatus';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import HarvesterKsmtuned from './HarvesterKsmtuned.vue';

export default {
  name: 'DetailHost',

  components: {
    Tabbed,
    Tab,
    Basic,
    Instance,
    ArrayListGrouped,
    Disk,
    InfoBox,
    VlanStatus,
    LabeledSelect,
    HarvesterKsmtuned,
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
      pods:          this.$store.dispatch(`${ inStore }/findAll`, { type: POD }),
    };

    if (this.$store.getters['harvester/schemaFor'](HCI.VLAN_STATUS)) {
      hash.hostNetworks = this.$store.dispatch('harvester/findAll', { type: HCI.VLAN_STATUS });
    }

    if (this.$store.getters['harvester/schemaFor'](HCI.BLOCK_DEVICE)) {
      hash.blockDevices = this.$store.dispatch('harvester/findAll', { type: HCI.BLOCK_DEVICE });
    }

    if (this.$store.getters['harvester/schemaFor'](LONGHORN.NODES)) {
      hash.longhornNodes = this.$store.dispatch('harvester/findAll', { type: LONGHORN.NODES });
    }

    const res = await allHash(hash);
    const hostNetworkResource = (res.hostNetworks || []).find( O => this.value.id === O.attachNodeName);

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
          isNew:          true,
          name:           d?.metadata?.name,
          originPath:     d?.spec?.fileSystem?.mountPoint,
          path:           d?.spec?.fileSystem?.mountPoint,
          blockDevice:    d,
          displayName:    d?.displayName,
          forceFormatted: d?.spec?.fileSystem?.forceFormatted || false,
        };
      });

    const disks = [...this.longhornDisks, ...provisionedBlockDevices];

    this.disks = disks;
    this.newDisks = clone(disks);
  },

  data() {
    return {
      metrics:               null,
      mode:                  'view',
      hostNetworkResource:   null,
      newDisks:              [],
      disks:                 [],
    };
  },

  computed: {
    longhornDisks() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNode = this.$store.getters[`${ inStore }/byId`](LONGHORN.NODES, `longhorn-system/${ this.value.id }`);
      const diskStatus = longhornNode?.status?.diskStatus || {};
      const diskSpec = longhornNode?.spec?.disks || {};

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
          displayName:      blockDevice?.displayName || key,
          forceFormatted:   blockDevice?.spec?.fileSystem?.forceFormatted || false,
        };
      });

      return longhornDisks;
    },

    hasBlockDevicesSchema() {
      return !!this.$store.getters['harvester/schemaFor'](HCI.BLOCK_DEVICE);
    },

    hasHostNetworksSchema() {
      return !!this.$store.getters['harvester/schemaFor'](HCI.VLAN_STATUS);
    },

    vlanStatuses() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const nodeId = this.value.id;
      const vlanStatuses = this.$store.getters[`${ inStore }/all`](HCI.VLAN_STATUS);

      return vlanStatuses.filter(s => s?.status?.node === nodeId) || [];
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
      <Tab name="basics" :label="t('harvester.host.tabs.basics')" :weight="4" class="bordered-table">
        <Basic
          v-model="value"
          :metrics="metrics"
          :mode="mode"
        />
      </Tab>
      <Tab name="instance" :label="t('harvester.host.tabs.instance')" :weight="3" class="bordered-table">
        <Instance :node="value" />
      </Tab>
      <Tab
        v-if="hasHostNetworksSchema"
        name="network"
        :label="t('harvester.host.tabs.network')"
        :weight="2"
        class="bordered-table"
      >
        <InfoBox
          v-for="vlan in vlanStatuses"
          :key="vlan.id"
        >
          <VlanStatus
            :value="vlan"
            :mode="mode"
          />
        </InfoBox>
      </Tab>
      <Tab
        v-if="hasBlockDevicesSchema"
        name="disk"
        :weight="1"
        :label="t('harvester.host.tabs.disk')"
      >
        <div
          v-if="longhornNode"
          class="row mb-20"
        >
          <div class="col span-12">
            <LabeledSelect
              v-model="longhornNode.spec.tags"
              :mode="mode"
              :multiple="true"
              :taggable="true"
              :options="[]"
              :label="t('harvester.host.tags.label')"
              :searchable="true"
            />
          </div>
        </div>
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

      <Tab
        name="disk"
        :weight="0"
        :show-header="false"
        :label="t('harvester.host.tabs.ksmtuned')"
      >
        <HarvesterKsmtuned :mode="mode" :node="value" />
      </Tab>
    </Tabbed>
  </div>
</template>
