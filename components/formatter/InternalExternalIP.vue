<script>
import { isV4Format, isV6Format } from 'ip';
import CopyToClipboardText from '@/components/CopyToClipboardText';

export default {
  components: { CopyToClipboardText },
  props:      {
    row: {
      type:     Object,
      required: true
    },
  },
  methods: {
    isIp(ip) {
      return ip && (isV4Format(ip) || isV6Format(ip));
    }
  }
};
</script>

<template>
  <span>
    <CopyToClipboardText v-if="isIp(row.internalIp)" :text="row.internalIp" /><span v-else>None</span>
    <span>/</span>
    <CopyToClipboardText v-if="isIp(row.externalIp)" :text="row.externalIp" /><span v-else>None</span>
  </span>
</template>
