<script>
export default {
  name:     'TestPanel',
  computed: {
    routeName() {
      return this.$route.name;
    }
  },
};
</script>

<template>
  <div>
    <h1>Test render page! {{ routeName }}</h1>
  </div>
</template>

<style lang="scss" scoped>
</style>
