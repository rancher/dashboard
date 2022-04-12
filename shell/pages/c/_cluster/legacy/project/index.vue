<script>
import IconMessage from '@shell/components/IconMessage';
import { project } from '@shell/store/type-map';

export default {
  components: { IconMessage },

  computed: {
    project() {
      const prj = project(this.$store.getters);

      return prj;
    }
  },

  watch: {
    project(nue, old) {
      if (nue && !old) {
        // User selected a project while on this page, so redirect to the projects view now that we have a project
        this.$router.replace({ name: 'c-cluster-legacy-project-page', params: { page: 'apps' } });
      }
    }
  }
};
</script>

<template>
  <IconMessage icon="icon-monitoring" message-key="legacy.project.select" />
</template>
