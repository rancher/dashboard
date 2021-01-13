<script>
import ConsumptionGauge from '@/components/ConsumptionGauge';
import Alert from '@/components/Alert';
import SortableTable from '@/components/SortableTable';
import Tab from '@/components/Tabbed/Tab';
import {
  EFFECT,
  IMAGE_SIZE,
  KEY,
  SIMPLE_NAME,
  VALUE
} from '@/config/table-headers';
import ResourceTabs from '@/components/form/ResourceTabs';
import Poller from '@/utils/poller';
import { METRIC, POD } from '@/config/types';
import createEditView from '@/mixins/create-edit-view';
import { formatSi, exponentNeeded, UNITS } from '@/utils/units';

const METRICS_POLL_RATE_MS = 30000;
const MAX_FAILURES = 2;

export default {
  name: 'DetailNode',

  components: {
    Alert,
    ConsumptionGauge,
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

  fetch() {
    return this.$store.dispatch('cluster/findAll', { type: POD });
  },

  data() {
    const podSchema = this.$store.getters['cluster/schemaFor'](POD);

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
          label:       '',
          dashIfEmpty: true,
        }
      ],
      imageTableHeaders: [
        { ...SIMPLE_NAME, width: 400 },
        IMAGE_SIZE
      ],
      taintTableHeaders: [
        KEY,
        VALUE,
        EFFECT
      ],
      podTableHeaders: this.$store.getters['type-map/headersFor'](podSchema)
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
          key:   this.t(`node.detail.tab.info.key.${ key }`),
          value: this.value.status.nodeInfo[key]
        }));
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
  <div class="node">
    <div class="spacer"></div>
    <div class="alerts">
      <Alert class="mr-10" :status="pidPressureStatus" :message="t('node.detail.glance.pidPressure')" />
      <Alert class="mr-10" :status="diskPressureStatus" :message="t('node.detail.glance.diskPressure')" />
      <Alert class="mr-10" :status="memoryPressureStatus" :message="t('node.detail.glance.memoryPressure')" />
      <Alert :status="kubeletStatus" :message="t('node.detail.glance.kubelet')" />
    </div>
    <div class="mt-20 resources">
      <ConsumptionGauge :resource-name="t('node.detail.glance.consumptionGauge.cpu')" :capacity="value.cpuCapacity" :used="value.cpuUsage" />
      <ConsumptionGauge :resource-name="t('node.detail.glance.consumptionGauge.memory')" :capacity="value.ramCapacity" :used="value.ramUsage" :units="memoryUnits" :number-formatter="memoryFormatter" />
      <ConsumptionGauge :resource-name="t('node.detail.glance.consumptionGauge.pods')" :capacity="value.podCapacity" :used="value.podConsumed" />
    </div>
    <div class="spacer"></div>
    <ResourceTabs v-model="value" :mode="mode">
      <Tab name="pods" :label="t('node.detail.tab.pods')" :weight="3">
        <SortableTable
          key-field="_key"
          :headers="podTableHeaders"
          :rows="value.pods"
          :row-actions="false"
          :table-actions="false"
          :search="false"
        />
      </Tab>
      <Tab name="info" :label="t('node.detail.tab.info.label')" class="bordered-table" :weight="2">
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
      <Tab name="images" :label="t('node.detail.tab.images')" :weight="1">
        <SortableTable
          key-field="_key"
          :headers="imageTableHeaders"
          :rows="imageTableRows"
          :row-actions="false"
          :table-actions="false"
        />
      </Tab>
      <Tab name="taints" :label="t('node.detail.tab.taints')" :weight="0">
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
  </div>
</template>

<style lang="scss" scoped>
.resources {
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  & > * {
    width: 30%;
  }
}
</style>
