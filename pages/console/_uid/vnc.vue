<script>
import { HCI } from '@/config/types';
import Console from '@/components/form/Console';

export default {
  layout: 'blank',

  components: { Console },

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
      this.$refs.console.close();
    });
  },

  head() {
    return { title: this.vmi.metadata.name };
  },
};
</script>

<template>
  <Console ref="console" v-model="vmi" />
</template>

<style lang="scss">
  body, #__nuxt, #__layout, main, #app, .vm-console, .vm-console >div, .vm-console >div >div{
    height: 100%;
  }
</style>
