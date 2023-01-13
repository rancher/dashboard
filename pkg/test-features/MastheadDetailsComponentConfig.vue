<script>
import Banner from '@components/Banner/Banner.vue';

export default {
  name:       'MastheadDetailsComponentConfig',
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
      This is another component example for masthead details - config view
    </Banner>
  </div>
</template>

<style lang="scss" scoped>

</style>
