<script>
export default {
  name:  'MyTabComponent',
  props: {
    resource: {
      type:    Object,
      default: () => ({})
    }
  },
  data() {
    return { key: 'value' };
  }
};
</script>

<template>
  <div>
    <h1>THIS IS A DEMO TAB</h1>
    <h2>{{ resource.id }}</h2>
  </div>
</template>

<style lang="scss" scoped>
</style>
