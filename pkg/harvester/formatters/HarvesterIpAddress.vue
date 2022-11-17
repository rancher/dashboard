<script>
import { OFF } from '../models/kubevirt.io.virtualmachine';
import { get } from '@shell/utils/object';
import { isIpv4 } from '@shell/utils/string';
import { HCI as HCI_ANNOTATIONS } from '@/pkg/harvester/config/labels-annotations';
import { HCI } from '../types';
import { MANAGEMENT_NETWORK } from '../mixins/harvester-vm';
import CopyToClipboard from '@shell/components/CopyToClipboard';

export default {
  components: { CopyToClipboard },
  props:      {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:    Object,
      default: () => {}
    }
  },

  computed: {
    // Return VM instance IP and VM annotation IP
    ips() {
      return [...this.vmiIp, ...this.networkAnnotationIP]
        .filter(Boolean)
        .sort((a, b) => a.ip < b.ip ? -1 : 1);
    },

    networkAnnotationIP() {
      if (this.row.actualState !== 'Running') { // TODO: Running
        return [];
      }

      const annotationIp = get(this.row, `metadata.annotations."${ HCI_ANNOTATIONS.NETWORK_IPS }"`) || '[]';

      // Obtain IP from VM annotation, remove the CIDR suffix number if CIDR Exist
      try {
        const out = JSON.parse(annotationIp);

        return out.map( ip => ({
          ip:   ip.replace(/\/[\d\D]*/, ''),
          name: ''
        }));
      } catch (e) {
        return [];
      }
    },

    vmiIp() {
      const vmiResources = this.$store.getters['harvester/all'](HCI.VMI);
      const resource = vmiResources.find(VMI => VMI.id === this.value) || null;
      const networksName = this.row.networksName || [];
      const vmiNetworks = resource?.spec?.networks || [];

      return (resource?.status?.interfaces || []).filter((intf) => {
        return isIpv4(intf.ipAddress) && networksName.includes(intf.name);
      }).map((intf) => {
        let name;
        const network = vmiNetworks.find(network => network.name === intf.name);

        if (network && network.multus) {
          name = network.multus.networkName;
        } else if (network && network.pod) {
          name = MANAGEMENT_NETWORK;
        }

        return {
          ip: intf.ipAddress,
          name
        };
      });
    },

    showIP() {
      return this.row.stateDisplay !== OFF;
    },
  },
};
</script>

<template>
  <div v-if="showIP">
    <span v-for="{ip, name} in ips" :key="ip">
      <span v-tooltip="name">{{ ip }}</span>
      <CopyToClipboard :text="ip" label-as="tooltip" class="icon-btn" action-color="bg-transparent" />
    </span>
  </div>
</template>
