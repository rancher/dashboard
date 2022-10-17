<script>
import { NODE } from '@shell/config/types';
import { HCI } from '../types';
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
    nodeName() {
      return this.node?.nameDisplay || '';
    },

    vmi() {
      const vmiResources = this.$store.getters['harvester/all'](HCI.VMI);
      const resource = vmiResources.find(VMI => VMI.id === this.row.id) || null;

      return resource;
    },

    node() {
      const nodeName = this.vmi?.status?.nodeName;

      return this.$store.getters['harvester/byId'](NODE, nodeName);
    },
  },
};
</script>

<template>
  <div>
    {{ nodeName }}
    <CopyToClipboard
      :text="nodeName"
      label-as="tooltip"
      class="icon-btn"
      action-color="bg-transparent"
    />
  </div>
</template>
