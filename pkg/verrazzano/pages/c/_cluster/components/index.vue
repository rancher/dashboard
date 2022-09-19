<script>
// Added by Verrazzano
import ResourceList from '@shell/components/ResourceList';

export default {
  name:       'ComponentsResourceList',
  components: { ResourceList },
  created() {
    this.$route.params['resource'] = 'core.oam.dev.component';
  }
};
</script>

<template>
  <ResourceList />
</template>
