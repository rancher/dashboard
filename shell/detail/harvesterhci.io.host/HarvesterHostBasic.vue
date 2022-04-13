<script>
import LabelValue from '@shell/components/LabelValue';
import Banner from '@shell/components/Banner';
import { formatSi, exponentNeeded, UNITS } from '@shell/utils/units';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { LONGHORN, METRIC, HCI } from '@shell/config/types';
import HarvesterCPUUsed from '@shell/components/formatter/HarvesterCPUUsed';
import HarvesterMemoryUsed from '@shell/components/formatter/HarvesterMemoryUsed';
import HarvesterStorageUsed from '@shell/components/formatter/HarvesterStorageUsed';

const COMPLETE = 'complete';
const NONE = 'none';
const PROMOTE_RESTART = 'promoteRestart';
const PROMOTE_SUCCEED = 'promoteSucceed';

export default {
  name: 'BasicNode',

  components: {
    LabelValue,
    Banner,
    HarvesterCPUUsed,
    HarvesterMemoryUsed,
    HarvesterStorageUsed,
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    metrics: {
      type:     Object,
      required: false,
      default:  () => {
        return null;
      }
    },

    mode: {
      type:     String,
      required: false,
      default:  'view'
    },

    hostNetworkResource: {
      type:     Object,
      required: false,
      default:  () => {
        return null;
      }
    }
  },

  computed: {
    customName() {
      return this.value.metadata?.annotations?.[HCI_ANNOTATIONS.HOST_CUSTOM_NAME];
    },

    consoleUrl() {
      const consoleUrl = this.value.metadata?.annotations?.[HCI_ANNOTATIONS.HOST_CONSOLE_URL];
      let value = consoleUrl;

      if (!consoleUrl) {
        return '';
      }

      if (!consoleUrl.startsWith('http://') && !consoleUrl.startsWith('https://')) {
        value = `http://${ consoleUrl }`;
      }

      return {
        display: consoleUrl,
        value
      };
    },

    cpuTotal() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.cpuCapacity;
      }

      return out;
    },

    cpuUsage() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.cpuUsage;
      }

      return out;
    },

    memoryTotal() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.memoryCapacity;
      }

      return out;
    },

    memoryUsage() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.memoryUsage;
      }

      return out;
    },

    storageUsage() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNode = this.$store.getters[`${ inStore }/byId`](LONGHORN.NODES, `longhorn-system/${ this.value.id }`);
      let out = 0;

      const diskStatus = longhornNode?.status?.diskStatus || {};

      Object.values(diskStatus).map((disk) => {
        if (disk?.storageAvailable && disk?.storageMaximum) {
          out += disk.storageMaximum - disk.storageAvailable;
        }
      });

      return out;
    },

    storageTotal() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const longhornNode = this.$store.getters[`${ inStore }/byId`](LONGHORN.NODES, `longhorn-system/${ this.value.id }`);
      let out = 0;

      const diskStatus = longhornNode?.status?.diskStatus || {};

      Object.values(diskStatus).map((disk) => {
        if (disk?.storageMaximum) {
          out += disk.storageMaximum;
        }
      });

      return out;
    },

    cpuUnits() {
      return 'C';
    },

    memoryUnits() {
      const exponent = exponentNeeded(this.memoryTotal, 1024);

      return `${ UNITS[exponent] }iB`;
    },

    storageUnits() {
      const exponent = exponentNeeded(this.storageTotal, 1024);

      return `${ UNITS[exponent] }iB`;
    },

    nodeType() {
      return this.value.isMaster ? this.t('harvester.host.detail.management') : this.t('harvester.host.detail.compute');
    },

    lastUpdateTime() {
      return this.value.status?.conditions?.[0]?.lastHeartbeatTime;
    },

    nodeRoleState() {
      const isExistRoleStatus = this.value.metadata?.labels?.[HCI_ANNOTATIONS.NODE_ROLE_MASTER] !== undefined || this.value.metadata?.labels?.[HCI_ANNOTATIONS.NODE_ROLE_CONTROL_PLANE] !== undefined;
      const promoteStatus = this.value.metadata?.annotations?.[HCI_ANNOTATIONS.PROMOTE_STATUS] || NONE;

      if (!isExistRoleStatus && promoteStatus === COMPLETE) {
        return PROMOTE_RESTART;
      } else if (isExistRoleStatus && promoteStatus === COMPLETE) {
        return PROMOTE_SUCCEED;
      }

      return promoteStatus;
    },

    networkType() {
      return this.hostNetworkResource?.spec?.type || '-';
    },

    nic() {
      return this.hostNetworkResource?.spec?.nic || '-';
    },

    networkMessage() {
      return this.hostNetworkResource?.message;
    },

    hasMetricNodeSchema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return !!this.$store.getters[`${ inStore }/schemaFor`](METRIC.NODE);
    },

    hasHostNetworksSchema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return !!this.$store.getters[`${ inStore }/schemaFor`](HCI.NODE_NETWORK);
    },
  },

  methods: {
    memoryFormatter(value) {
      const exponent = exponentNeeded(this.memoryTotal, 1024);

      const formatOptions = {
        addSuffix:   false,
        increment:   1024,
        minExponent: exponent
      };

      return formatSi(value, formatOptions);
    },
  }
};
</script>

<template>
  <div class="host-detail">
    <h3>{{ t('harvester.host.tabs.overview') }}</h3>
    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue :name="t('harvester.host.detail.customName')" :value="customName" />
      </div>
      <div class="col span-6">
        <LabelValue :name="t('harvester.host.detail.hostIP')" :value="value.internalIp" />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue :name="t('harvester.host.detail.os')" :value="value.status.nodeInfo.osImage" />
      </div>
      <div class="col span-6">
        <div class="role">
          <LabelValue :name="t('harvester.host.detail.role')">
            <template #value>
              {{ nodeType }}
              <span class="text-warning ml-20">
                {{ t(`harvester.host.promote.${nodeRoleState}`) }}
              </span>
            </template>
          </LabelValue>
        </div>
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue :name="t('harvester.host.detail.create')" :value="value.metadata.creationTimestamp" />
      </div>
      <div class="col span-6">
        <LabelValue :name="t('harvester.host.detail.update')" :value="lastUpdateTime" />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue :name="t('harvester.host.detail.consoleUrl')" :value="consoleUrl.value">
          <a slot="value" :href="consoleUrl.value" target="_blank">{{ consoleUrl.display }}</a>
        </LabelValue>
      </div>
    </div>

    <div v-if="hasHostNetworksSchema">
      <hr class="divider" />
      <h3>{{ t('harvester.host.detail.title.network') }}</h3>
      <Banner v-if="networkMessage" color="error">
        {{ networkMessage }}
      </Banner>
      <div class="row mb-20">
        <div class="col span-6">
          <LabelValue :name="t('harvester.host.detail.networkType')" :value="networkType" />
        </div>

        <div class="col span-6">
          <LabelValue :name="t('harvester.host.detail.nic')" :value="nic" />
        </div>
      </div>
    </div>

    <div v-if="hasMetricNodeSchema">
      <hr class="divider" />
      <h3>{{ t('harvester.host.tabs.monitor') }}</h3>
      <div class="row mb-20">
        <div class="col span-4">
          <HarvesterCPUUsed
            :row="value"
            :resource-name="t('node.detail.glance.consumptionGauge.cpu')"
            :show-used="true"
          />
        </div>
        <div class="col span-4">
          <HarvesterMemoryUsed
            :row="value"
            :resource-name="t('node.detail.glance.consumptionGauge.memory')"
            :show-used="true"
          />
        </div>
        <div class="col span-4">
          <HarvesterStorageUsed
            :row="value"
            :resource-name="t('harvester.host.detail.storage')"
            :show-reserved="true"
          />
        </div>
      </div>
    </div>

    <hr class="section-divider" />
    <h3>{{ t('harvester.host.detail.more') }}</h3>
    <div class="row mb-20">
      <div class="col span-4">
        <LabelValue :name="t('harvester.host.detail.uuid')" :value="value.status.nodeInfo.systemUUID" />
      </div>

      <div class="col span-4">
        <LabelValue :name="t('harvester.host.detail.kernel')" :value="value.status.nodeInfo.kernelVersion" />
      </div>

      <div class="col span-4">
        <LabelValue :name="t('harvester.host.detail.containerRuntime')" :value="value.status.nodeInfo.containerRuntimeVersion" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.role {
  display: flex;
}
</style>
