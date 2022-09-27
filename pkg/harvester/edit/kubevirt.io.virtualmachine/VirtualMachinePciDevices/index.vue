<script>
import { _EDIT } from '@shell/config/query-params';
import { allHash } from '@shell/utils/promise';
import { HCI } from '../../../types';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Banner from '@components/Banner/Banner.vue';
import CompatibilityMatrix from './CompatibilityMatrix';
import DeviceList from './DeviceList';

import remove from 'lodash/remove';
import { set } from '@shell/utils/object';

export default {
  name:       'VirtualMachinePCIDevices',
  components: {
    LabeledSelect,
    DeviceList,
    CompatibilityMatrix,
    Banner
  },
  props:      {
    mode: {
      type:    String,
      default: _EDIT
    },
    // spec.template.spec
    value: {
      type:    Object,
      default: () => {}
    }
  },

  async fetch() {
    const hash = {
      // claims fetched here so synchronous pciDevice model property works
      pciDevices: this.$store.dispatch('harvester/findAll', { type: HCI.PCI_DEVICE }),
      claims:     this.$store.dispatch('harvester/findAll', { type: HCI.PCI_CLAIM }),
    };

    const res = await allHash(hash);

    for (const key in res) {
      this[key] = res[key];
    }
  },

  data() {
    return {
      pciDevices:      [],
      claims:          [],
      selectedDevices: [],
      pciDeviceSchema: this.$store.getters['harvester/schemaFor'](HCI.PCI_DEVICE),
      showMatrix:      false,
    };
  },

  watch: {
    selectedDevices(neu) {
      const formatted = neu.map((deviceUid, idx) => {
        const deviceCRD = this.uniqueDevices[deviceUid].deviceCRDs[0];
        const deviceName = deviceCRD?.status?.resourceName;

        return {
          deviceName,
          name: `${ deviceName.split('/')[1] }${ idx + 1 }`
        };
      });

      set(this.value.domain.devices, 'hostDevices', formatted);
    }
  },

  computed: {
    // user can only select devices for whcih pci passthrough is enabled/claimed by them - determined by finding the associated passthrough CRD
    enabledDevices() {
      return this.pciDevices.filter((device) => {
        return device.isEnabled && device.claimedByMe;
      }) || [];
    },

    // pciDevice is one per device per node - if multiple nodes have device or multiple devices on a node there will be duplicate deviceID vendorID
    uniqueDevices() {
      const out = {};

      this.enabledDevices.forEach((deviceCRD) => {
        const uniqueId = deviceCRD.uniqueId;
        const deviceNode = deviceCRD?.status?.nodeName;

        if (!out[uniqueId]) {
          out[uniqueId] = {
            nodes:      [deviceNode],
            deviceCRDs: [deviceCRD]
          };
        } else {
          if (!out[uniqueId].nodes.includes(deviceNode)) {
            out[uniqueId].nodes.push(deviceNode);
          }
          out[uniqueId].deviceCRDs.push(deviceCRD);
        }
      });

      return out;
    },

    devicesByNode() {
      const out = {};

      for (const deviceUid in this.uniqueDevices) {
        const nodesWithDevice = this.uniqueDevices[deviceUid].nodes;

        nodesWithDevice.forEach((node) => {
          if (!out[node]) {
            out[node] = [deviceUid];
          } else {
            out[node].push(deviceUid);
          }
        });
      }

      return out;
    },

    // determine which nodes contain all devices selected
    compatibleNodes() {
      const out = [...Object.keys(this.devicesByNode)];

      this.selectedDevices.forEach((deviceUid) => {
        remove(out, (nodeName) => {
          const nodesWithDevice = this.uniqueDevices[deviceUid].nodes;

          return !nodesWithDevice.includes(nodeName);
        });
      });

      return out;
    },

    // format an array of available devices for the dropdown
    deviceOpts() {
      return Object.keys(this.uniqueDevices).map((deviceId) => {
        const device = this.uniqueDevices[deviceId].deviceCRDs[0];

        return {
          resourceName: device?.status?.resourceName,
          value:        deviceId,
          label:        deviceId
        };
      });
    },
  },

  methods: {
    nodeNameFromUid(uid) {
      for (const deviceUid in this.uniqueDevices) {
        const nodes = this.uniqueDevices[deviceUid].nodes;
        const thisNode = nodes.find(node => node.systemUUID === uid);

        if (thisNode) {
          return thisNode.name;
        }
      }
    },
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <Banner color="info">
          <t k="harvester.pci.howToUseDevice" />
        </Banner>
      </div>
    </div>
    <template v-if="enabledDevices.length">
      <div class="row">
        <div class="col span-6">
          <LabeledSelect
            v-model="selectedDevices"
            label="Available PCI Devices"
            searchable
            multiple
            taggable
            :options="deviceOpts"
          >
            <template #option="option">
              <span>{{ option.value }} <span class="text-label">{{ option.resourceName }}</span></span>
            </template>
          </LabeledSelect>
        </div>
      </div>
      <div v-if="compatibleNodes.length && selectedDevices.length" class="row">
        <div class="col span-12 text-muted">
          Compatible hosts:
          <!-- eslint-disable-next-line vue/no-parsing-error -->
          <span v-for="(node, idx) in compatibleNodes" :key="node">{{ node }}{{ idx < compatibleNodes.length-1 ? ', ' : '' }}</span>
        </div>
      </div>
      <div v-else-if="selectedDevices.length" class="text-error">
        {{ t('harvester.pci.impossibleSelection') }}
      </div>
      <button type="button" class="btn btn-sm role-link pl-0" @click="e=>{showMatrix = !showMatrix; e.target.blur()}">
        {{ showMatrix ? t('harvester.pci.hideCompatibility') : t('harvester.pci.showCompatibility') }}
      </button>
      <div v-if="showMatrix" class="row mt-20">
        <div class="col span-12">
          <CompatibilityMatrix :unique-devices="uniqueDevices" :devices-by-node="devicesByNode" />
        </div>
      </div>
    </template>
    <div class="row mt-20">
      <div class="col span-12">
        <DeviceList :schema="pciDeviceSchema" :rows="pciDevices" @submit.prevent />
      </div>
    </div>
  </div>
</template>
