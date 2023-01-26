<script>
export default {
  name:  'ClusterDashboardCard',
  props: {
    resource: {
      type:     Object,
      required: true
    }
  }
};
</script>

<template>
  <div>
    <h1>ClusterDashboardCard</h1>
    <h2>{{ resource.metadata.state.message }}</h2>
  </div>
</template>

<style lang="scss" scoped>

</style>
