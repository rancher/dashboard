<script>
import capitalize from 'lodash/capitalize';
import words from 'lodash/words';
import ConsumptionGauge from '@/components/ConsumptionGauge';
import HStack from '@/components/Layout/Stack/HStack';
import VStack from '@/components/Layout/Stack/VStack';
import Alert from '@/components/Alert';
import SortableTable from '@/components/SortableTable';
import Tab from '@/components/Tabbed/Tab';
import {
  ADDRESS,
  EFFECT,
  IMAGE_SIZE,
  KEY,
  SIMPLE_NAME,
  SIMPLE_TYPE,
  VALUE,
} from '@/config/table-headers';
import ResourceTabs from '@/components/form/ResourceTabs';
import Poller from '@/utils/poller';
import { METRIC } from '@/config/types';
import createEditView from '@/mixins/create-edit-view';
import { formatSi, exponentNeeded, UNITS } from '@/utils/units';

const METRICS_POLL_RATE_MS = 30000;
const MAX_FAILURES = 2;

export default {
  name: 'DetailNode',

  components: {
    Alert,
    ConsumptionGauge,
    HStack,
    VStack,
    ResourceTabs,
    Tab,
    SortableTable,
  },

  mixins: [createEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      metricPoller:           new Poller(this.loadMetrics, METRICS_POLL_RATE_MS, MAX_FAILURES),
      metrics:                { cpu: 0, memory: 0 },
      infoTableHeaders: [
        {
          ...KEY,
          label: '',
          width: 200
        },
        {
          ...VALUE,
          label: ''
        }
      ],
      addressTableHeaders: [
        SIMPLE_TYPE,
        ADDRESS
      ],
      imageTableHeaders: [
        { ...SIMPLE_NAME, width: 400 },
        IMAGE_SIZE
      ],
      taintTableHeaders: [
        KEY,
        VALUE,
        EFFECT
      ]
    };
  },

  computed: {
    memoryUnits() {
      const exponent = exponentNeeded(this.value.ramCapacity, 1024);

      return `${ UNITS[exponent] }iB`;
    },

    pidPressureStatus() {
      return this.mapToStatus(this.value.isPidPressureOk);
    },

    diskPressureStatus() {
      return this.mapToStatus(this.value.isDiskPressureOk);
    },

    memoryPressureStatus() {
      return this.mapToStatus(this.value.isMemoryPressureOk);
    },

    kubeletStatus() {
      return this.mapToStatus(this.value.isKubeletOk);
    },

    infoTableRows() {
      return Object.keys(this.value.status.nodeInfo)
        .map(key => ({
          key:   capitalize(words(key).join(' ')),
          value: this.value.status.nodeInfo[key]
        }));
    },

    addressTableRows() {
      const addresses = [...this.value.status.addresses];

      if (this.value.externalIp) {
        addresses.push({
          type:    this.t('node.detail.tab.address.externalIp'),
          address: this.value.externalIp
        });
      }

      return addresses;
    },

    imageTableRows() {
      return this.value.status.images.map(image => ({
        // image.names[1] typically has the user friendly name but on occasion there's only one name and we should use that
        name:      image.names[1] || image.names[0],
        sizeBytes: image.sizeBytes
      }));
    },

    taintTableRows() {
      return this.value.spec.taints || [];
    },
  },

  mounted() {
    this.metricPoller.start();
  },

  beforeDestroy() {
    this.metricPoller.stop();
  },

  methods: {
    memoryFormatter(value) {
      const formatOptions = {
        addSuffix:  false,
        increment:  1024,
      };

      return formatSi(value, formatOptions);
    },

    mapToStatus(isOk) {
      return isOk ? 'success' : 'error';
    },

    async loadMetrics() {
      const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

      if (schema) {
        await this.$store.dispatch('cluster/find', {
          type: METRIC.NODE,
          id:   this.value.id,
          opt:  { force: true }
        });

        this.$forceUpdate();
      }
    }
  }
};
</script>

<template>
  <VStack class="node">
    <HStack class="glance" :show-dividers="true">
      <VStack class="alerts" :show-dividers="true" vertical-align="space-evenly">
        <Alert :status="pidPressureStatus" :message="t('node.detail.glance.pidPressure')" />
        <Alert :status="diskPressureStatus" :message="t('node.detail.glance.diskPressure')" />
        <Alert :status="memoryPressureStatus" :message="t('node.detail.glance.memoryPressure')" />
        <Alert :status="kubeletStatus" :message="t('node.detail.glance.kubelet')" />
      </VStack>
      <HStack class="cluster" horizontal-align="space-evenly">
        <ConsumptionGauge :resource-name="t('node.detail.glance.consumptionGauge.cpu')" :capacity="value.cpuCapacity" :used="value.cpuUsage" />
        <ConsumptionGauge :resource-name="t('node.detail.glance.consumptionGauge.memory')" :capacity="value.ramCapacity" :used="value.ramUsage" :units="memoryUnits" :number-formatter="memoryFormatter" />
        <ConsumptionGauge :resource-name="t('node.detail.glance.consumptionGauge.pods')" :capacity="value.podCapacity" :used="value.podConsumed" />
      </HStack>
    </HStack>
    <ResourceTabs v-model="value" :mode="mode">
      <Tab name="info" :label="t('node.detail.tab.info')" class="bordered-table">
        <SortableTable
          key-field="_key"
          :headers="infoTableHeaders"
          :rows="infoTableRows"
          :row-actions="false"
          :table-actions="false"
          :show-headers="false"
          :search="false"
        />
      </Tab>
      <Tab name="address" :label="t('node.detail.tab.address.label')">
        <SortableTable
          key-field="_key"
          :headers="addressTableHeaders"
          :rows="addressTableRows"
          :row-actions="false"
          :table-actions="false"
          :search="false"
        />
      </Tab>
      <Tab name="images" :label="t('node.detail.tab.images')">
        <SortableTable
          key-field="_key"
          :headers="imageTableHeaders"
          :rows="imageTableRows"
          :row-actions="false"
          :table-actions="false"
        />
      </Tab>
      <Tab name="taints" :label="t('node.detail.tab.taints')">
        <SortableTable
          key-field="_key"
          :headers="taintTableHeaders"
          :rows="taintTableRows"
          :row-actions="false"
          :table-actions="false"
          :search="false"
        />
      </Tab>
    </ResourceTabs>
  </VStack>
</template>

<style lang="scss" scoped>
.cluster {
  flex: 1;
}

$divider-spacing: 20px;

.glance {
  margin-top: 20px;

  & > * {
    padding: 0 $divider-spacing;

    &:first-child {
      padding-left: 0;
    }
  }
}

.alerts {
  width: 25%;
  & > * {
    flex: 1;
  }
}
</style>
