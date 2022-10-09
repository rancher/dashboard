<script>
import EmbeddedPageView from '@shell/components/EmberPageView';
import { mapGetters } from 'vuex';

export default {
  components: { EmbeddedPageView },

  computed: {
    ...mapGetters(['currentCluster']),
    pages() {
      return { 'cluster-vlansubnet': `/c/${ this.currentCluster.id }/vlansubnet` };
    }
  },

};
</script>

<template>
  <EmbeddedPageView :pages="pages" />
</template>
