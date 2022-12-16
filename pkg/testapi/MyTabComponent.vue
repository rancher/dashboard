<script>
export default {
  props: {
    resource: {
      type:     Object,
      required: true,
    }
  },

  mounted() {
    console.log('My Tab Component'); // eslint-disable-line no-console

    console.log(this.resource); // eslint-disable-line no-console
  }
};
</script>

<template>
  <div>
    <h1>MY TAB</h1>
  </div>
</template>

<style lang="scss" scoped>
</style>
