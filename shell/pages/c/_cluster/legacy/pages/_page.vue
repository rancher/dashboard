<script>
import EmberPage from '@shell/components/EmberPage';

const PAGES = {
  monitoring: 'monitoring/cluster-setting',
  cis:        'cis/scan',
  istio:      'istio/cluster-setting',
  snapshots:  'backups',
};

export default {
  components: { EmberPage },

  data() {
    const cluster = this.$store.getters['currentCluster'];
    const page = this.$route.params.page;
    const p = PAGES[page] || page;

    return { src: `/k/${ cluster.id }/${ p }` };
  }
};
</script>

<template>
  <EmberPage v-if="src" :src="src" />
</template>
