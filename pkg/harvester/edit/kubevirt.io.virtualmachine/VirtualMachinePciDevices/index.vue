<script>
import { _EDIT } from '@shell/config/query-params';
import { allHash } from '@shell/utils/promise';
import { HCI } from '../../../types';
import { HCI as HCI_LABELS } from '@shell/config/labels-annotations';

import LabeledSelect from '@shell/components/form/LabeledSelect';
import Banner from '@components/Banner/Banner.vue';
import CompatibilityMatrix from './CompatibilityMatrix';
import DeviceList from './DeviceList';

import remove from 'lodash/remove';
import { set } from '@shell/utils/object';
// TODO get the right path to pcid in vm & verify its format
// 'value' here is <vm>.spec.template.spec
const PATH_TO_DEVICES = 'pci';

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
    value(neu) {
      if (!neu.affinity) {
        this.$set(neu, 'affinity', { nodeAffinity: { requiredDuringSchedulingIgnoredDuringExecution: { nodeSelectorTerms: [] } } } );
      }
      if (!neu.affinity.nodeAffinity) {
        this.$set(neu.affinity, 'nodeAffinity', { requiredDuringSchedulingIgnoredDuringExecution: { nodeSelectorTerms: [] } } );
      }
      if (!neu.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution) {
        this.$set(neu.nodeAffinity, 'requiredDuringSchedulingIgnoredDuringExecution', { nodeSelectorTerms: [] });
      }
      if (!neu.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms) {
        this.$set(neu.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution, 'nodeSelectorTerms', []);
      }
    },

    selectedDevices(neu) {
      set(this.value, PATH_TO_DEVICES, neu);
    }
  },

  computed: {
    nodeSelectorTerms() {
      return this.value?.affinity?.nodeAffinity?.requiredDuringSchedulingIgnoredDuringExecution?.nodeSelectorTerms;
    },

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

    // // array of device uids available on compatible nodes
    // compatibleDeviceOpts() {
    //   const out = [];

    //   for (const deviceUid in this.uniqueDevices) {
    //     const nodesWithDevice = this.uniqueDevices[deviceUid].nodes;

    //     if (nodesWithDevice.some(nodeName => this.compatibleNodes.includes(nodeName))) {
    //       const device = this.uniqueDevices[deviceUid].deviceCRDs[0];

    //       out.push({
    //         description: device?.status?.description,
    //         value:       deviceUid,
    //         label:       deviceUid
    //       });
    //     }
    //   }

    //   return out;
    // },

    // format an array of available devices for the dropdown
    deviceOpts() {
      return Object.keys(this.uniqueDevices).map((deviceId) => {
        const device = this.uniqueDevices[deviceId].deviceCRDs[0];

        return {
          description: device?.status?.description,
          value:       deviceId,
          label:       deviceId
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

    // add a label selector so the VM is scheduled on a node w/ this device
    addToNodeAffinity(deviceUid) {
      const t = this.$store.getters['i18n/t'];

      this.selectedDevices.push(deviceUid);
      const deviceCRD = this.uniqueDevices[deviceUid].deviceCRDs[0];
      const labelRegex = new RegExp(`${ HCI_LABELS.PCI_DEVICE.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') }.*`);
      const existingTerm = this.nodeSelectorTerms.find((term) => {
        return term?.matchExpressions.find(rule => rule?.key.match(labelRegex));
      });

      if (existingTerm) {
        existingTerm.matchExpressions.push({
          key:      deviceCRD.nodeLabel,
          operator: 'Exists',
          _forced:  t('harvester.pci.labelRequired')
        });
      } else {
        this.nodeSelectorTerms.push({
          matchExpressions: [{
            key:      deviceCRD.nodeLabel,
            operator: 'Exists',
            _forced:  t('harvester.pci.labelRequired')
          }]
        });
      }
    },

    removeFromNodeAffinity(deviceUid) {
      remove(this.selectedDevices, device => device === deviceUid);
      const deviceCRD = this.uniqueDevices[deviceUid].deviceCRDs[0];

      const termContainingRule = this.nodeSelectorTerms.find((term) => {
        return !!term?.matchExpressions.find(rule => rule?.key === deviceCRD.nodeLabel);
      });

      remove(termContainingRule.matchExpressions, (rule) => {
        return rule?.key === deviceCRD.nodeLabel;
      });

      if (termContainingRule.matchExpressions.length === 0) {
        remove(this.nodeSelectorTerms, term => term === termContainingRule );
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
            @deselecting="option=>removeFromNodeAffinity(option.value)"
            @selecting="option=>addToNodeAffinity(option.value)"
          >
            <template #option="option">
              <span>{{ option.value }} <span class="text-label">{{ option.description }}</span></span>
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
