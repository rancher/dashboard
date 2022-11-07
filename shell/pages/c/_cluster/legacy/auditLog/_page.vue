<script>
import EmbeddedPageView from '@shell/components/EmberPageView';
import { mapGetters } from 'vuex';
import { PROJECT_ID, WORKLOAD_ID } from '@shell/config/query-params';

export default {
  components: { EmbeddedPageView },

  computed: {
    ...mapGetters(['currentCluster']),
    pages() {
      return {
        'cluster-audit-log':  `/c/${ this.currentCluster.id }/audit-log`,
        'project-audit-log':  `/p/${ encodeURIComponent(this.$route.query[PROJECT_ID]) }/audit-log`,
        'workload-audit-log': `/p/${ encodeURIComponent(this.$route.query[PROJECT_ID]) }/workloads/audit-log?workloadId=${ encodeURIComponent(this.$route.query[WORKLOAD_ID]) }`,
      };
    }
  },

};
</script>

<template>
  <EmbeddedPageView :pages="pages" />
</template>
