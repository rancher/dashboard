<script>
import { mapGetters } from 'vuex';
export default {
  props: {
    /**
     * deviceId/vendorId is unique per type of device - there may be multiple pciDevice CRD objects for a given device
     * {
     *  [deviceId/vendorId]: {
     *      nodes: array of devicecrd.status.nodeName's for given device,
     *      deviceCRDs: array of all instances (pciDevice CRD) of given device
     *      }
     * }
     */
    uniqueDevices: {
      type:     Object,
      required: true
    },
    /**
 * {
 *  [node name]: [devices]
 * }
 */
    devicesByNode: {
      type:     Object,
      required: true
    },

    /**
 * {
 *  [deviceCRD.status.resourceName]: {
 *      count: number of this device in use by other vms
 *      usedBy: [names of all vms using this device]
 *    }
 * }
 */

    devicesInUse: {
      type:    Object,
      default: () => {}
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),
    allNodeNames() {
      return Object.keys(this.devicesByNode);
    },

    allDeviceIds() {
      return Object.keys(this.uniqueDevices);
    }
  },

  methods: {
    deviceDescription(id) {
      return (this.uniqueDevices[id]?.deviceCRDs || [])[0]?.status?.description;
    },

    nodeNameFromId(id) {
      return this.devicesByNode[id]?.name;
    },

    nodeHasDevice(nodeName, deviceId) {
      const allNodesWithDevice = this.uniqueDevices[deviceId]?.nodes;

      return allNodesWithDevice.includes(nodeName);
    },

    vmsUsingDevice(id) {
      const resourceName = this.uniqueDevices[id].deviceCRDs[0].status?.resourceName;

      return this.devicesInUse[resourceName]?.usedBy || null;
    },

    noneAvailable(id) {
      const resourceName = this.uniqueDevices[id].deviceCRDs[0].status?.resourceName;

      const count = this.devicesInUse[resourceName]?.count || 0;

      return count === this.uniqueDevices[id].deviceCRDs.length;
    },

    deviceTooltip(id) {
      if (this.vmsUsingDevice(id)) {
        return `${ this.deviceDescription(id) }<br/>${ this.t('harvester.pci.tooltip', { numVMs: this.vmsUsingDevice(id).length }) }`;
      }

      return this.deviceDescription(id);
    }
  }
};
</script>

<template>
  <div class="compat-matrix">
    <div class="device-col node-names">
      <div class="blank-corner" />
      <div v-for="nodeName in allNodeNames" :key="nodeName" class="node-label">
        <span>  {{ nodeName }}</span>
      </div>
    </div>
    <div v-for="deviceId in allDeviceIds" :key="deviceId" class="device-col">
      <div v-tooltip="deviceTooltip(deviceId)" class="compat-cell device-label" :class="{'text-muted': noneAvailable(deviceId)}">
        {{ deviceId }}
      </div>
      <div
        v-for="nodeName in allNodeNames"
        :key="nodeName"
        class="compat-cell"
        :class="{'has-device': nodeHasDevice(nodeName, deviceId)}"
      />
    </div>
  </div>
</template>

<style lang='scss'>
.compat-matrix {
    display: flex;
}

.device-col {
    display: flex;
    flex-direction: column;

    border-right: 1px solid var(--border);

    &>*{
        border-bottom: 1px solid var(--border);
    }
}

.compat-cell {
    flex-basis: 1em;
    padding: 0px 10px 0px 10px;

    &.has-device {
        background-color: var(--info-banner-bg);
    }
}

.node-label, .device-label {
    display: flex;
    align-items: center;
    color: var(--input-label);
}

.node-label{
    justify-content: flex-end;
}

.node-label, .device-label, .compat-cell, .blank-corner {
    flex-basis: calc(1em + 10px);
}
</style>
