<script>
import { HCI } from '@/config/types';
import SerialConsole from '@/components/form/SerialConsole';

export default {
  layout: 'blank',

  components: { SerialConsole },

  data() {
    return { uid: this.$route.params.uid };
  },

  computed: {
    vmi() {
      const vmiList = this.$store.getters['virtual/all'](HCI.VMI) || [];
      const vmi = vmiList.find( (VMI) => {
        return VMI?.metadata?.ownerReferences?.[0]?.uid === this.uid;
      });

      return vmi;
    },
  },

  mounted() {
    window.addEventListener('beforeunload', () => {
      this.$refs.serialConsole.close();
    });
  },

  head() {
    return { title: this.vmi.metadata.name };
  },
};
</script>

<template>
  <SerialConsole ref="serialConsole" v-model="vmi" />
</template>

<style lang="scss">
  body, #__nuxt, #__layout, main {
    height: 100%;
  }
</style>
