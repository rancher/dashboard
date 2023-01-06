<script>
import Banner from '@components/Banner/Banner.vue';

export default {
  name:       'BannerComponent',
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
      Just a sample banner
    </Banner>
  </div>
</template>

<style lang="scss" scoped>

</style>
