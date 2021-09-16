<script>
import VM_MIXIN from '@/mixins/harvester-vm';
import Volume from '@/edit/kubevirt.io.virtualmachine/VirtualMachineVolume';

export default {
  name: 'Disks',

  components: { Volume },

  mixins: [VM_MIXIN],

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  data() {
    return { spec: this.value.spec };
  },

  watch: {
    value: {
      handler(neu) {
        this.$set(this, 'spec', this.value.spec);
      },
      deep: true
    },
  },
};
</script>

<template>
  <div class="vm-inventory">
    <Volume v-model="diskRows" :namespace="value.metadata.namespace" mode="view" />
  </div>
</template>
