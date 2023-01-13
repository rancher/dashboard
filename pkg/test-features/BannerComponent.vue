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
      Just a sample banner to show that we can render anything here
    </Banner>
  </div>
</template>

<style lang="scss" scoped>

</style>
