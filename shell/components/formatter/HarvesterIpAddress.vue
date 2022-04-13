<script>
import compact from 'lodash/compact';
import { get } from '@shell/utils/object';
import { isIpv4 } from '@shell/utils/string';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { HCI } from '@shell/config/types';
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
    },
    col: {
      type:     Object,
      default: () => {}
    }
  },

  computed: {
    ip() {
      const s = new Set([...this.vmiIp, ...this.networkAnnotationIP]);

      return compact([...s]).sort();
    },

    networkAnnotationIP() {
      if (this.row.actualState !== 'Running') { // TODO: Running
        return [];
      }

      const annotationIp = get(this.row, `metadata.annotations."${ HCI_ANNOTATIONS.NETWORK_IPS }"`) || '[]';

      const out = JSON.parse(annotationIp);

      return out.map( (O) => {
        return O.replace(/\/[\d\D]*/, '');
      });
    },

    vmiIp() {
      const vmiResources = this.$store.getters['harvester/all'](HCI.VMI);
      const resource = vmiResources.find(VMI => VMI.id === this.value) || null;

      return (resource?.status?.interfaces || []).filter((O) => {
        return isIpv4(O.ipAddress);
      }).map(O => O.ipAddress);
    }
  },
};
</script>

<template>
  <div>
    <span v-for="(ipValue) in ip" :key="ipValue">
      {{ ipValue }}<CopyToClipboard :text="ipValue" label-as="tooltip" class="icon-btn" action-color="bg-transparent" />
    </span>
  </div>
</template>
