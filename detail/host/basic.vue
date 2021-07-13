<script>
import ConsumptionGauge from '@/components/ConsumptionGauge';
import LabelValue from '@/components/LabelValue';
import Banner from '@/components/Banner';
import { formatSi, exponentNeeded, UNITS } from '@/utils/units';
import { HOST_CUSTOM_NAME } from '@/config/labels-annotations';
import { get } from '@/utils/object';

export default {
  name: 'BasicNode',

  components: {
    ConsumptionGauge, LabelValue, Banner
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

    hostNetowrkResource: {
      type:     Object,
      required: false,
      default:  () => {
        return null;
      }
    }
  },

  computed: {
    customName() {
      return get(this, `metadata.labels."${ HOST_CUSTOM_NAME }"`) || '';
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
      let out = 0;

      if (this.metrics) {
        out = this.metrics.storageUsage;
      }

      return out;
    },

    storageTotal() {
      let out = 0;

      if (this.metrics) {
        out = this.metrics.storageTotal;
      }

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
      return this.value.isMaster ? this.t('harvester.hostPage.detail.management') : this.t('harvester.hostPage.detail.compute');
    },

    lastUpdateTime() {
      return this.value.status?.conditions?.[0]?.lastHeartbeatTime;
    },

    nodeRoleState() {
      return this.value.nodeRoleState;
    },

    networkType() {
      return this.hostNetowrkResource?.spec?.type;
    },

    nic() {
      return this.hostNetowrkResource?.spec?.nic;
    },

    networkMessage() {
      return this.hostNetowrkResource?.message;
    }
  },

  methods: {
    memoryFormatter(value, exponent) {
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
    <h3>{{ t('harvester.vmPage.detail.tabs.overview') }}</h3>
    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue :name="t('harvester.hostPage.detail.customName')" :value="customName" />
      </div>
      <div class="col span-6">
        <LabelValue :name="t('harvester.hostPage.detail.hostIP')" :value="value.internalIp" />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue :name="t('harvester.hostPage.detail.os')" :value="value.status.nodeInfo.osImage" />
      </div>
      <div class="col span-6">
        <div class="role">
          <LabelValue :name="t('harvester.hostPage.detail.role')">
            <template #value>
              {{ nodeType }}
              <span class="text-warning ml-20">
                {{ t(`harvester.hostPage.promote.${nodeRoleState}`) }}
              </span>
            </template>
          </LabelValue>
        </div>
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue :name="t('harvester.hostPage.detail.create')" :value="value.metadata.creationTimestamp" />
      </div>
      <div class="col span-6">
        <LabelValue :name="t('harvester.hostPage.detail.update')" :value="lastUpdateTime" />
      </div>
    </div>

    <hr class="divider" />
    <h3>{{ t('harvester.hostPage.detail.title.network') }}</h3>
    <Banner v-if="networkMessage" color="error">
      {{ networkMessage }}
    </Banner>
    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue :name="t('harvester.hostPage.detail.networkType')" :value="networkType" />
      </div>

      <div class="col span-6">
        <LabelValue :name="t('harvester.hostPage.detail.nic')" :value="nic" />
      </div>
    </div>

    <hr class="divider" />
    <h3>{{ t('harvester.vmPage.detail.tabs.monitor') }}</h3>
    <div class="row mb-20">
      <div class="col span-4">
        <ConsumptionGauge :resource-name="t('node.detail.glance.consumptionGauge.cpu')" :capacity="cpuTotal" :used="cpuUsage" :units="cpuUnits" />
      </div>
      <div class="col span-4">
        <ConsumptionGauge :resource-name="t('node.detail.glance.consumptionGauge.memory')" :capacity="memoryTotal" :used="memoryUsage" :units="memoryUnits" :number-formatter="memoryFormatter" />
      </div>
      <div class="col span-4">
        <ConsumptionGauge :resource-name="t('harvester.hostPage.detail.storage')" :capacity="storageTotal" :used="storageUsage" :units="storageUnits" :number-formatter="memoryFormatter" />
      </div>
    </div>

    <hr class="section-divider" />
    <h3>{{ t('harvester.hostPage.detail.more') }}</h3>
    <div class="row mb-20">
      <div class="col span-4">
        <LabelValue :name="t('harvester.hostPage.detail.uuid')" :value="value.status.nodeInfo.systemUUID" />
      </div>

      <div class="col span-4">
        <LabelValue :name="t('harvester.hostPage.detail.kernel')" :value="value.status.nodeInfo.kernelVersion" />
      </div>

      <div class="col span-4">
        <LabelValue :name="t('harvester.hostPage.detail.containerRuntime')" :value="value.status.nodeInfo.containerRuntimeVersion" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.role {
  display: flex;
}
</style>
