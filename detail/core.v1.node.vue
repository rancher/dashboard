<script>
import CopyToClipboardText from '@/components/CopyToClipboardText';
import ConsumptionGauge from '@/components/ConsumptionGauge';
import DetailTop from '@/components/DetailTop';
import HStack from '@/components/Layout/Stack/HStack';
import VStack from '@/components/Layout/Stack/VStack';
import Alert from '@/components/Alert';
import SortableTable from '@/components/SortableTable';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import {
  TYPE,
  STATUS,
  LAST_HEARTBEAT_TIME,
  REASON,
  MESSAGE,
  KEY,
  VALUE
} from '@/config/table-headers';

export default {
  name: 'DetailNode',

  components: {
    Alert, ConsumptionGauge, CopyToClipboardText, DetailTop, HStack, VStack, Tab, Tabbed, SortableTable
  },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    return {
      statusTableHeaders: [
        TYPE,
        STATUS,
        LAST_HEARTBEAT_TIME,
        REASON,
        MESSAGE
      ],
      systemTableHeaders: [
        KEY,
        VALUE
      ],
      labelsTableHeaders: [
        KEY,
        VALUE
      ],
      annotationsTableHeaders: [
        KEY,
        VALUE
      ],
    };
  },

  computed: {
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
    statusTableRows() {
      return this.value.status.conditions;
    },
    systemTableRows() {
      return Object.keys(this.value.status.nodeInfo)
        .map(key => ({
          key,
          value: this.value.status.nodeInfo[key]
        }));
    },
    labelsTableRows() {
      return Object.keys(this.value.metadata.labels)
        .map(key => ({
          key,
          value: this.value.metadata.labels[key]
        }));
    },
    annotationsTableRows() {
      return Object.keys(this.value.metadata.annotations)
        .map(key => ({
          key,
          value: this.value.metadata.annotations[key]
        }));
    },

    detailTopColumns() {
      return [
        {
          title:   'Description',
          content: this.value.id
        },
        {
          title: 'IP Address',
          name:  'ipAddress'
        },
        {
          title: 'Version',
          name:  'version'
        },
        {
          title: 'OS',
          name:  'os'
        },
        {
          title: 'Created',
          name:  'created'
        },
      ];
    }
  },

  methods: {
    memoryFormatter(value) {
      return (value / 1000000).toFixed(2);
    },
    mapToStatus(isOk) {
      return isOk
        ? 'success'
        : 'error';
    }
  }
};
</script>

<template>
  <VStack class="node">
    <DetailTop :columns="detailTopColumns">
      <template v-slot:ipAddress>
        <CopyToClipboardText :text="value.status.addresses[0].address" />
      </template>
      <template v-slot:version>
        <CopyToClipboardText :text="value.status.nodeInfo.kubeletVersion" />
      </template>
      <template v-slot:os>
        <CopyToClipboardText :text="value.status.nodeInfo.operatingSystem" />
      </template>
      <template v-slot:created>
        <CopyToClipboardText :text="value.metadata.creationTimestamp" />
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
        <ConsumptionGauge resource-name="CPU" :capacity="value.cpuCapacity" :used="value.cpuConsumed" />
        <ConsumptionGauge resource-name="MEMORY" :capacity="value.ramCapacity" :used="value.ramConsumed" units="GiB" :number-formatter="memoryFormatter" />
        <ConsumptionGauge resource-name="PODS" :capacity="value.podCapacity" :used="value.podConsumed" />
      </HStack>
    </HStack>
    <Tabbed default-tab="status">
      <Tab name="status" label="Status">
        <SortableTable
          key-field="_key"
          :headers="statusTableHeaders"
          :rows="statusTableRows"
          :row-actions="false"
        />
      </Tab>
      <Tab name="system" label="System">
        <SortableTable
          key-field="_key"
          :headers="systemTableHeaders"
          :rows="systemTableRows"
          :row-actions="false"
        />
      </Tab>
      <Tab name="labels" label="Labels">
        <SortableTable
          key-field="_key"
          :headers="labelsTableHeaders"
          :rows="labelsTableRows"
          :row-actions="false"
        />
      </Tab>
      <Tab name="annotations" label="Annotations">
        <SortableTable
          key-field="_key"
          :headers="annotationsTableHeaders"
          :rows="annotationsTableRows"
          :row-actions="false"
        />
      </Tab>
    </Tabbed>
  </VStack>
</template>

<style lang="scss" scoped>
.cluster {
  flex: 1;
}

$divider-spacing: 20px;

.glance {
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
