<script>
import { get } from '@/utils/object';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import { HCI } from '@/config/types';
import CopyToClipboard from '@/components/CopyToClipboard';
import compact from 'lodash/compact';

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

      return compact([...s]);
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
      const out = resource?.status?.interfaces?.[0]?.ipAddress || '';

      return [out];
    }
  },
};
</script>

<template>
  <div>
    <span v-for="(ipValue, index) in ip" :key="index">
      {{ ipValue }}<CopyToClipboard :text="ipValue" label-as="tooltip" class="icon-btn" action-color="bg-transparent" />
    </span>
  </div>
</template>
