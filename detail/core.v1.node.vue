<script>
import CopyToClipboardText from '@/components/CopyToClipboardText';
import ConsumptionGauge from '@/components/ConsumptionGauge';
import DetailTop from '@/components/DetailTop';
import DetailTopColumn from '@/components/DetailTopColumn';
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
    Alert, ConsumptionGauge, CopyToClipboardText, DetailTop, DetailTopColumn, HStack, VStack, Tab, Tabbed, SortableTable
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
    <DetailTop>
      <DetailTopColumn title="Description">
        {{ value.id }}
      </DetailTopColumn>
      <DetailTopColumn title="IP Address">
        <CopyToClipboardText :text="value.status.addresses[0].address" />
      </DetailTopColumn>
      <DetailTopColumn title="Version">
        <CopyToClipboardText :text="value.status.nodeInfo.kubeletVersion" />
      </DetailTopColumn>
      <DetailTopColumn title="OS">
        <CopyToClipboardText :text="value.status.nodeInfo.operatingSystem" />
      </DetailTopColumn>
      <DetailTopColumn title="Created">
        <CopyToClipboardText :text="value.metadata.creationTimestamp" />
      </DetailTopColumn>
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
