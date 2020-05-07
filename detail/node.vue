<script>
import { capitalize, words } from 'lodash';
import ConsumptionGauge from '@/components/ConsumptionGauge';
import DetailTop from '@/components/DetailTop';
import HStack from '@/components/Layout/Stack/HStack';
import VStack from '@/components/Layout/Stack/VStack';
import Alert from '@/components/Alert';
import SortableTable from '@/components/SortableTable';
import Tab from '@/components/Tabbed/Tab';
import BadgeState from '@/components/BadgeState';
import {
  ADDRESS,
  EFFECT,
  IMAGE_SIZE,
  KEY,
  LAST_HEARTBEAT_TIME,
  MESSAGE,
  REASON,
  SIMPLE_NAME,
  SIMPLE_TYPE,
  STATUS,
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
    BadgeState,
    ConsumptionGauge,
    DetailTop,
    HStack,
    VStack,
    ResourceTabs,
    Tab,
    SortableTable
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
      conditionsTableHeaders: [
        SIMPLE_TYPE,
        STATUS,
        LAST_HEARTBEAT_TIME,
        REASON,
        MESSAGE
      ],
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

    conditionsTableRows() {
      return this.value.status.conditions;
    },

    infoTableRows() {
      return Object.keys(this.value.status.nodeInfo)
        .map(key => ({
          key:   capitalize(words(key).join(' ')),
          value: this.value.status.nodeInfo[key]
        }));
    },

    addressTableRows() {
      return this.value.status.addresses;
    },

    imageTableRows() {
      return this.value.status.images.map(image => ({
        name:      image.names[1],
        sizeBytes: image.sizeBytes
      }));
    },

    taintTableRows() {
      return this.value.spec.taints || [];
    },

    detailTopColumns() {
      return [
        {
          title: 'State',
          name:  'state'
        },
        {
          title:   'IP Address',
          content:  this.value.internalIp
        },
        {
          title:   'Version',
          content:  this.value.version
        },
        {
          title:   'OS',
          content:  this.value.status.nodeInfo.osImage
        },
        {
          title:   'Container Runtime',
          name:    'container-runtime'
        },
      ];
    }
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
      return isOk
        ? 'success'
        : 'error';
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
    <DetailTop :columns="detailTopColumns">
      <template v-slot:state>
        <BadgeState v-if="value.showDetailStateBadge" :value="value" />
      </template>
      <template v-slot:container-runtime>
        <span><span v-if="value.containerRuntimeIcon" class="icon" :class="value.containerRuntimeIcon" /> {{ value.containerRuntimeVersion }}</span>
      </template>
    </DetailTop>
    <HStack class="glance" :show-dividers="true">
      <VStack class="alerts" :show-dividers="true" vertical-align="space-evenly">
        <Alert :status="pidPressureStatus" message="PID Pressure" />
        <Alert :status="diskPressureStatus" message="Disk Pressure" />
        <Alert :status="memoryPressureStatus" message="Memory Pressure" />
        <Alert :status="kubeletStatus" message="Kubelet" />
      </VStack>
      <HStack class="cluster" horizontal-align="space-evenly">
        <ConsumptionGauge resource-name="CPU" :capacity="value.cpuCapacity" :used="value.cpuUsage" />
        <ConsumptionGauge resource-name="MEMORY" :capacity="value.ramCapacity" :used="value.ramUsage" :units="memoryUnits" :number-formatter="memoryFormatter" />
        <ConsumptionGauge resource-name="PODS" :capacity="value.podCapacity" :used="value.podConsumed" />
      </HStack>
    </HStack>
    <ResourceTabs v-model="value" :mode="mode">
      <template v-slot:before>
        <Tab name="conditions" label="Conditions">
          <SortableTable
            key-field="_key"
            :headers="conditionsTableHeaders"
            :rows="conditionsTableRows"
            :row-actions="false"
            :table-actions="false"
          />
        </Tab>
        <Tab name="info" label="Info">
          <SortableTable
            key-field="_key"
            :headers="infoTableHeaders"
            :rows="infoTableRows"
            :row-actions="false"
            :table-actions="false"
            :show-headers="false"
          />
        </Tab>
        <Tab name="address" label="Address">
          <SortableTable
            key-field="_key"
            :headers="addressTableHeaders"
            :rows="addressTableRows"
            :row-actions="false"
            :table-actions="false"
            :search="false"
          />
        </Tab>
        <Tab name="images" label="Images">
          <SortableTable
            key-field="_key"
            :headers="imageTableHeaders"
            :rows="imageTableRows"
            :row-actions="false"
            :table-actions="false"
          />
        </Tab>
        <Tab name="taints" label="Taints">
          <SortableTable
            key-field="_key"
            :headers="taintTableHeaders"
            :rows="taintTableRows"
            :row-actions="false"
            :table-actions="false"
          />
        </Tab>
      </template>
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
