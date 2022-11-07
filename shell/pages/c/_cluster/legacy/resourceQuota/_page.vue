<script>
import EmbeddedPageView from '@shell/components/EmberPageView';
import { mapGetters } from 'vuex';
import { PROJECT_ID } from '@shell/config/query-params';

export default {
  components: { EmbeddedPageView },

  computed: {
    ...mapGetters(['currentCluster']),
    pages() {
      return { 'project-resource-quota': `/p/${ encodeURIComponent(this.$route.query[PROJECT_ID]) }/quotas-cn` };
    }
  },

};
</script>

<template>
  <EmbeddedPageView :pages="pages" />
</template>
