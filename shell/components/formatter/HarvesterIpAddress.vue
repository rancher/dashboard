<script>
import { OFF } from '@shell/models/harvester/kubevirt.io.virtualmachine';
import { get } from '@shell/utils/object';
import { isIpv4 } from '@shell/utils/string';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { HCI } from '@shell/config/types';
import { MANAGEMENT_NETWORK } from '@shell/mixins/harvester-vm';
import CopyToClipboard from '@shell/components/CopyToClipboard';

export default {
  components: { CopyToClipboard },
  props:      {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    }
  },

  computed: {
    ips() {
      return [...this.vmiIp, ...this.networkAnnotationIP].filter(IP => !!IP.ip).sort((a, b) => {
        if (a.ip < b.ip) {
          return -1;
        }

        return 1;
      });
    },

    networkAnnotationIP() {
      if (this.row.actualState !== 'Running') { // TODO: Running
        return [];
      }

      const annotationIp = get(this.row, `metadata.annotations."${ HCI_ANNOTATIONS.NETWORK_IPS }"`) || '[]';

      try {
        const out = JSON.parse(annotationIp);

        return out.map( (O) => {
          return {
            ip:   O.replace(/\/[\d\D]*/, ''),
            name: ''
          };
        });
      } catch (e) {
        return [];
      }
    },

    vmiIp() {
      const vmiResources = this.$store.getters['harvester/all'](HCI.VMI);
      const resource = vmiResources.find(VMI => VMI.id === this.value) || null;
      const networksName = this.row.networksName || [];
      const vmiNetworks = resource?.spec?.networks;

      return (resource?.status?.interfaces || []).filter((O) => {
        return isIpv4(O.ipAddress) && networksName.includes(O.name);
      }).map((O) => {
        let name;
        const network = vmiNetworks.find(N => N.name === O.name);

        if (network && network.multus) {
          name = network.multus.networkName;
        } else if (network && network.pod) {
          name = MANAGEMENT_NETWORK;
        }

        return {
          ip: O.ipAddress,
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
