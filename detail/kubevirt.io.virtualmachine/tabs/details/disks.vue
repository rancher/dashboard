<script>
import VM_MIXIN from '@/mixins/vm';
import Volume from '@/edit/kubevirt.io.virtualmachine/volume';

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
    <Volume v-model="diskRows" mode="view" />

    <!-- <ModalWithCard ref="CDROM" name="CDROM" close-text="No" save-text="Yes" @beforeClose="beforeClose">
      <template #title>
        Eject CDROM
      </template>

      <template #content>
        <div>
          Are you sure you want to eject CD-ROM
          <span class="text-info">{{ nameString }}</span>, this action will restart the virtual machine
        </div>
      </template>
    </ModalWithCard> -->
  </div>
</template>
