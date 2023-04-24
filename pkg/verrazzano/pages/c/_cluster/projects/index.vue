<script>
// Added by Verrazzano
import ResourceList from '@shell/components/ResourceList';

export default {
  name:       'ProjectsResourceList',
  components: { ResourceList },
  created() {
    this.$route.params['resource'] = 'clusters.verrazzano.io.verrazzanoproject';
  }
};
</script>

<template>
  <ResourceList />
</template>
