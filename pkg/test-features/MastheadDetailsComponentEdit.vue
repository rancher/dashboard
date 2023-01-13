<script>
import Banner from '@components/Banner/Banner.vue';

export default {
  name:       'MastheadDetailsComponentEdit',
  components: { Banner },
  data() {
    return { key: 'asdasd' };
  }
};
</script>

<template>
  <div>
    <Banner
      color="info"
    >
      This is another component example for masthead details - edit view
    </Banner>
  </div>
</template>

<style lang="scss" scoped>

</style>
