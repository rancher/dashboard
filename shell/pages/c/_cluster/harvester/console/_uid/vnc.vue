<script>
import { HCI } from '@shell/config/types';
import NovncConsoleWrapper from '@shell/components/NovncConsoleWrapper';
import Loading from '@shell/components/Loading';

export default {
  layout: 'blank',

  components: { NovncConsoleWrapper, Loading },

  async fetch() {
    this.rows = await this.$store.dispatch('harvester/findAll', { type: HCI.VMI });
  },

  data() {
    return { uid: this.$route.params.uid };
  },

  computed: {
    vmi() {
      const vmiList = this.$store.getters['harvester/all'](HCI.VMI) || [];

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
    return { title: this.vmi?.metadata?.name };
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <NovncConsoleWrapper v-else ref="console" v-model="vmi" class="novnc-wrapper" />
</template>
