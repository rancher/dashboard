<script>
// Added by Verrazzano
import ResourceList from '@shell/components/ResourceList';

export default {
  name:       'ApplicationConfigurations',
  components: { ResourceList },
  created() {
    this.$route.params['resource'] = 'core.oam.dev.applicationconfiguration';
  }
};
</script>

<template>
  <ResourceList />
</template>

<style scoped>

</style>
