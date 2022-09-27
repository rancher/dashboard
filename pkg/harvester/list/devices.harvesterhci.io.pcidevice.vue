<script>
import DeviceList from '../edit/kubevirt.io.virtualmachine/VirtualMachinePciDevices/DeviceList';

export default {
  name: 'ListPciDevicePage',

  components: { DeviceList },

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    rows: {
      type:     Array,
      required: true,
    },

  },

};
</script>

<template>
  <DeviceList :rows="rows" :schema="schema" />
</template>
